import prisma from '@/lib/prisma';

// Helper to generate bill number
function generateBillNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BILL-${year}${month}-${random}`;
}

// Get or create a bill for a patient
// First checks for any existing open bill for the same patient (by patientId)
// If found, uses that bill. Otherwise creates a new one.
async function getOrCreateBill(encounterId: string, patientId: string) {
    // First, try to find any existing open bill for this PATIENT (not just encounter)
    // This consolidates charges across multiple encounters/visits for the same patient
    let bill = await prisma.bill.findFirst({
        where: {
            patientId,
            status: { in: ['draft', 'pending', 'partial'] }
        },
        orderBy: { createdAt: 'desc' }, // Get most recent open bill
    });

    if (!bill) {
        // No existing open bill for patient, create a new one
        let billNumber = generateBillNumber();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.bill.findUnique({ where: { billNumber } });
            if (!existing) break;
            billNumber = generateBillNumber();
            attempts++;
        }

        // Create new bill
        bill = await prisma.bill.create({
            data: {
                billNumber,
                patientId,
                encounterId: encounterId, // Link to the first encounter that created this bill
                status: 'pending',
                subtotal: 0,
                totalAmount: 0,
                balanceDue: 0,
            } as any,
        });
    }

    return bill;
}

// Add item to bill and recalculate totals
export async function addBillItem(params: {
    encounterId: string;
    patientId: string;
    category: string;
    department: string;
    itemCode?: string;
    description: string;
    quantity?: number;
    unitPrice: number;
}) {
    const { encounterId, patientId, category, department, itemCode, description, quantity = 1, unitPrice } = params;

    // Get or create bill
    const bill = await getOrCreateBill(encounterId, patientId);

    // Check if this item already exists on the bill (avoid duplicates)
    const existingItem = await prisma.billItem.findFirst({
        where: {
            billId: bill.id,
            itemCode,
            description,
        },
    });

    if (existingItem) {
        // Item already exists, don't add duplicate
        return { bill, item: existingItem, duplicate: true };
    }

    // Create bill item
    const totalPrice = quantity * unitPrice;
    const item = await prisma.billItem.create({
        data: {
            billId: bill.id,
            category,
            // department, // Commenting out to avoid build error if schema mismatch
            itemCode,
            description,
            quantity,
            unitPrice,
            totalPrice,
        } as any,
    });

    // Recalculate bill totals
    const allItems = await prisma.billItem.findMany({
        where: { billId: bill.id },
    });

    const subtotal = allItems.reduce((sum: number, i: { totalPrice: number }) => sum + i.totalPrice, 0);
    const totalAmount = subtotal - bill.discountAmount + bill.taxAmount;
    const balanceDue = totalAmount - bill.paidAmount;

    await prisma.bill.update({
        where: { id: bill.id },
        data: { subtotal, totalAmount, balanceDue },
    });

    return { bill, item, duplicate: false };
}

// Get price from TariffMaster
export async function getServicePrice(tariffCode: string): Promise<number | null> {
    const tariff = await prisma.tariffMaster.findUnique({
        where: { tariffCode },
    });
    return tariff?.basePrice ?? null;
}

// Get default consultation fee based on department
export async function getConsultationFee(department: string): Promise<number> {
    // Try to find department-specific consultation tariff
    const deptTariff = await prisma.tariffMaster.findFirst({
        where: {
            category: 'consultation',
            tariffCode: { startsWith: `CON-${department.substring(0, 3).toUpperCase()}` },
            isActive: true,
        },
    });

    if (deptTariff) {
        return deptTariff.basePrice;
    }

    // Fall back to specialist or general consultation fee
    const specialistTariff = await prisma.tariffMaster.findUnique({
        where: { tariffCode: 'CON-SPE' },
    });

    if (specialistTariff) {
        return specialistTariff.basePrice;
    }

    // Default if no tariff found
    return 500;
}

// Get lab test price
export async function getLabTestPrice(testCode: string): Promise<number> {
    // Try exact match first
    const tariff = await prisma.tariffMaster.findUnique({
        where: { tariffCode: `LAB-${testCode.toUpperCase()}` },
    });

    if (tariff) {
        return tariff.basePrice;
    }

    // Try to find by category
    const anyLabTariff = await prisma.tariffMaster.findFirst({
        where: { category: 'lab', isActive: true },
    });

    // Return found price or default
    return anyLabTariff?.basePrice ?? 400;
}

// Get medication price from tariff or inventory
export async function getMedicationPrice(medicationName: string): Promise<number> {
    // Try to find in tariff master
    const normalizedName = medicationName.toLowerCase().replace(/\s+/g, '-');
    const tariff = await prisma.tariffMaster.findFirst({
        where: {
            category: 'pharmacy',
            OR: [
                { tariffCode: { contains: normalizedName } },
                { description: { contains: medicationName, mode: 'insensitive' } },
            ],
            isActive: true,
        },
    });

    if (tariff) {
        return tariff.basePrice;
    }

    // Try to find in inventory
    const inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
            name: { contains: medicationName.split(' ')[0], mode: 'insensitive' },
            category: 'medicine',
        },
        include: {
            batches: {
                where: { quantity: { gt: 0 } },
                orderBy: { expiryDate: 'asc' },
                take: 1,
            },
        },
    });

    if (inventoryItem?.batches[0]?.sellingPrice) {
        return inventoryItem.batches[0].sellingPrice;
    }

    // Default medication price
    return 50;
}
