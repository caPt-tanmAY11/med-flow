/**
 * PaisaTracker - Billing Aggregate API
 * 
 * GET: Fetch patient bill summary with breakdown
 * POST: Finalize bill or add manual items
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPatientBillSummary, addBillItem, finalizeBill, recalculateBillTotals } from '@/lib/billing';

// GET - Fetch patient billing summary
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const encounterId = searchParams.get('encounterId');
        const billId = searchParams.get('billId');

        // Single bill detail
        if (billId) {
            const bill = await prisma.bill.findUnique({
                where: { id: billId },
                include: {
                    items: { orderBy: { category: 'asc' } },
                    payments: { orderBy: { receivedAt: 'desc' } },
                    discounts: true,
                    patient: { select: { id: true, name: true, uhid: true } },
                    encounter: { select: { id: true, type: true, admissionTime: true } }
                }
            });

            if (!bill) {
                return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
            }

            // Group items by category
            const itemsByCategory: Record<string, typeof bill.items> = {};
            for (const item of bill.items) {
                if (!itemsByCategory[item.category]) {
                    itemsByCategory[item.category] = [];
                }
                itemsByCategory[item.category].push(item);
            }

            return NextResponse.json({
                bill,
                itemsByCategory,
                categoryTotals: Object.entries(itemsByCategory).map(([category, items]) => ({
                    category,
                    count: items.length,
                    total: items.reduce((sum, i) => sum + i.totalPrice, 0)
                }))
            });
        }

        // Patient full summary
        if (patientId) {
            const summary = await getPatientBillSummary(patientId);
            return NextResponse.json(summary);
        }

        // Encounter-specific bill
        if (encounterId) {
            const bill = await prisma.bill.findFirst({
                where: { encounterId },
                include: {
                    items: { orderBy: { category: 'asc' } },
                    payments: true,
                    discounts: true,
                    patient: { select: { id: true, name: true, uhid: true } }
                }
            });

            return NextResponse.json({ bill });
        }

        return NextResponse.json({ error: 'patientId, encounterId, or billId required' }, { status: 400 });

    } catch (error) {
        console.error('Billing GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST - Actions: add-item, finalize, add-payment
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action } = body;

        switch (action) {
            case 'add-item': {
                const { patientId, encounterId, category, description, quantity, unitPrice, itemCode, tariffId } = body;

                if (!patientId || !encounterId || !category || !description || !unitPrice) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }

                await addBillItem(patientId, encounterId, {
                    category,
                    itemCode,
                    description,
                    quantity: quantity || 1,
                    unitPrice,
                    tariffId
                });

                return NextResponse.json({ success: true, message: 'Item added to bill' });
            }

            case 'finalize': {
                const { billId, finalizedBy } = body;

                if (!billId) {
                    return NextResponse.json({ error: 'billId required' }, { status: 400 });
                }

                await finalizeBill(billId, finalizedBy || 'SYSTEM');

                const bill = await prisma.bill.findUnique({ where: { id: billId } });
                return NextResponse.json({ success: true, bill });
            }

            case 'add-payment': {
                const { billId, amount, paymentMode, referenceNumber, receivedBy } = body;

                if (!billId || !amount || !paymentMode) {
                    return NextResponse.json({ error: 'billId, amount, paymentMode required' }, { status: 400 });
                }

                await prisma.payment.create({
                    data: {
                        billId,
                        amount,
                        paymentMode,
                        referenceNumber,
                        receivedBy: receivedBy || 'CASHIER'
                    }
                });

                await recalculateBillTotals(billId);

                const updatedBill = await prisma.bill.findUnique({ where: { id: billId } });

                // Auto-mark as paid if balance is zero
                if (updatedBill && updatedBill.balanceDue <= 0) {
                    await prisma.bill.update({
                        where: { id: billId },
                        data: { status: 'paid' }
                    });
                }

                return NextResponse.json({ success: true, bill: updatedBill });
            }

            case 'apply-discount': {
                const { billId, discountType, discountValue, reason, approvedBy } = body;

                if (!billId || !discountType || discountValue === undefined) {
                    return NextResponse.json({ error: 'billId, discountType, discountValue required' }, { status: 400 });
                }

                await prisma.billDiscount.create({
                    data: {
                        billId,
                        discountType,
                        discountValue,
                        reason,
                        approvedBy,
                        approvedAt: new Date(),
                        status: 'approved'
                    }
                });

                await recalculateBillTotals(billId);

                return NextResponse.json({ success: true, message: 'Discount applied' });
            }

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Billing POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
