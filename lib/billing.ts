/**
 * PaisaTracker - Billing Utility Functions
 * 
 * Central billing logic for the hospital system.
 * Handles automatic bill creation when services are used.
 */

import prisma from './prisma';

// ========== Types ==========

export interface BillItemInput {
    category: 'CONSULTATION' | 'LAB' | 'PHARMACY' | 'ROOM' | 'PROCEDURE' | 'EMERGENCY' | 'RADIOLOGY' | 'MISC';
    itemCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    tariffId?: string;
}

export interface CreateBillInput {
    patientId: string;
    encounterId: string;
    items: BillItemInput[];
}

// ========== Bill Number Generator ==========

export async function generateBillNumber(): Promise<string> {
    const today = new Date();
    const prefix = `BILL-${today.getFullYear()}${(today.getMonth() + 1).toString().padStart(2, '0')}`;

    // Get count of bills today for sequencing
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayBillCount = await prisma.bill.count({
        where: {
            createdAt: { gte: startOfDay, lte: endOfDay }
        }
    });

    const sequence = (todayBillCount + 1).toString().padStart(4, '0');
    return `${prefix}-${sequence}`;
}

// ========== Get or Create Bill for Encounter ==========

export async function getOrCreateEncounterBill(patientId: string, encounterId: string): Promise<string> {
    // Check for existing draft bill
    const existingBill = await prisma.bill.findFirst({
        where: {
            patientId,
            encounterId,
            status: 'draft'
        }
    });

    if (existingBill) {
        return existingBill.id;
    }

    // Create new bill
    const billNumber = await generateBillNumber();
    const newBill = await prisma.bill.create({
        data: {
            billNumber,
            patientId,
            encounterId,
            status: 'draft',
            subtotal: 0,
            discountAmount: 0,
            taxAmount: 0,
            totalAmount: 0,
            paidAmount: 0,
            balanceDue: 0,
        }
    });

    return newBill.id;
}

// ========== Add Item to Bill (Auto-billing trigger) ==========

export async function addBillItem(
    patientId: string,
    encounterId: string,
    item: BillItemInput
): Promise<void> {
    const billId = await getOrCreateEncounterBill(patientId, encounterId);

    const totalPrice = item.quantity * item.unitPrice;

    // Create the bill item
    await prisma.billItem.create({
        data: {
            billId,
            category: item.category,
            itemCode: item.itemCode,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice,
            tariffId: item.tariffId,
        }
    });

    // Recalculate bill totals
    await recalculateBillTotals(billId);
}

// ========== Recalculate Bill Totals ==========

export async function recalculateBillTotals(billId: string): Promise<void> {
    // Get all items for this bill
    const items = await prisma.billItem.findMany({
        where: { billId }
    });

    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

    // Get discounts
    const discounts = await prisma.billDiscount.findMany({
        where: { billId, status: 'approved' }
    });

    const discountAmount = discounts.reduce((sum, d) => sum + d.discountValue, 0);

    // Get payments
    const payments = await prisma.payment.findMany({
        where: { billId }
    });

    const paidAmount = payments.reduce((sum, p) => sum + p.amount, 0);

    // Calculate totals (no tax for medical services in India typically)
    const totalAmount = subtotal - discountAmount;
    const balanceDue = totalAmount - paidAmount;

    // Update bill
    await prisma.bill.update({
        where: { id: billId },
        data: {
            subtotal,
            discountAmount,
            totalAmount,
            paidAmount,
            balanceDue,
        }
    });
}

// ========== Get Tariff by Code ==========

export async function getTariffByCode(tariffCode: string) {
    return prisma.tariffMaster.findUnique({
        where: { tariffCode, isActive: true }
    });
}

// ========== Look up Tariff and Create Bill Item ==========

export async function billServiceByTariff(
    patientId: string,
    encounterId: string,
    tariffCode: string,
    quantity: number = 1
): Promise<void> {
    const tariff = await getTariffByCode(tariffCode);

    if (!tariff) {
        console.warn(`Tariff not found: ${tariffCode}`);
        return;
    }

    await addBillItem(patientId, encounterId, {
        category: tariff.category as any,
        itemCode: tariffCode,
        description: tariff.description,
        quantity,
        unitPrice: tariff.basePrice,
        tariffId: tariff.id,
    });
}

// ========== Finalize Bill ==========

export async function finalizeBill(billId: string, finalizedBy: string): Promise<void> {
    await recalculateBillTotals(billId);

    await prisma.bill.update({
        where: { id: billId },
        data: {
            status: 'finalized',
            finalizedAt: new Date(),
            finalizedBy,
        }
    });
}

// ========== Get Patient Bill Summary ==========

export async function getPatientBillSummary(patientId: string) {
    const bills = await prisma.bill.findMany({
        where: { patientId },
        include: {
            items: true,
            payments: true,
            discounts: { where: { status: 'approved' } },
            encounter: {
                select: {
                    id: true,
                    type: true,
                    admissionTime: true,
                    dischargeTime: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Category-wise breakdown
    const categoryBreakdown: Record<string, number> = {};
    let totalBilled = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;

    for (const bill of bills) {
        totalBilled += bill.totalAmount;
        totalPaid += bill.paidAmount;
        totalOutstanding += bill.balanceDue;

        for (const item of bill.items) {
            categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + item.totalPrice;
        }
    }

    return {
        bills,
        summary: {
            totalBilled,
            totalPaid,
            totalOutstanding,
            categoryBreakdown,
        }
    };
}

// ========== Revenue Analytics (Admin) ==========

export async function getRevenueAnalytics(startDate?: Date, endDate?: Date) {
    const whereClause: any = { status: { in: ['finalized', 'paid'] } };

    if (startDate && endDate) {
        whereClause.createdAt = { gte: startDate, lte: endDate };
    }

    const bills = await prisma.bill.findMany({
        where: whereClause,
        include: { items: true, payments: true }
    });

    // Aggregate by category
    const revenueByCategory: Record<string, number> = {};
    const revenueByDay: Record<string, number> = {};
    let totalRevenue = 0;
    let totalCollected = 0;

    for (const bill of bills) {
        totalRevenue += bill.totalAmount;
        totalCollected += bill.paidAmount;

        // By category
        for (const item of bill.items) {
            revenueByCategory[item.category] = (revenueByCategory[item.category] || 0) + item.totalPrice;
        }

        // By day
        const day = bill.createdAt.toISOString().slice(0, 10);
        revenueByDay[day] = (revenueByDay[day] || 0) + bill.totalAmount;
    }

    return {
        totalRevenue,
        totalCollected,
        outstanding: totalRevenue - totalCollected,
        revenueByCategory,
        revenueByDay,
        billCount: bills.length,
    };
}
