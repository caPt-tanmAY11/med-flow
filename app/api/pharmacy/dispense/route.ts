import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { addBillItem, getTariffByCode, billServiceByTariff } from '@/lib/billing';

const dispenseSchema = z.object({
    medicationId: z.string().uuid(),
    dispensedBy: z.string(),
    batchNumber: z.string().optional(),
    quantity: z.number().int().optional(),
});

// POST /api/pharmacy/dispense - Dispense medication
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = dispenseSchema.parse(body);

        const medication = await prisma.prescriptionMedication.findUnique({
            where: { id: data.medicationId },
            include: {
                prescription: {
                    include: { patient: true },
                },
            },
        });

        if (!medication) {
            return NextResponse.json({ error: 'Medication not found' }, { status: 404 });
        }

        if (medication.isDispensed) {
            return NextResponse.json({ error: 'Already dispensed' }, { status: 400 });
        }

        await prisma.prescriptionMedication.update({
            where: { id: data.medicationId },
            data: { isDispensed: true },
        });

        // Check if all medications are dispensed
        const pendingMeds = await prisma.prescriptionMedication.count({
            where: {
                prescriptionId: medication.prescriptionId,
                isDispensed: false,
            },
        });

        if (pendingMeds === 0) {
            await prisma.prescription.update({
                where: { id: medication.prescriptionId },
                data: { status: 'completed' },
            });
        }

        // Create stock transaction if quantity available
        if (data.quantity) {
            await prisma.stockTransaction.create({
                data: {
                    itemId: data.medicationId, // Link to inventory
                    transactionType: 'issue',
                    quantity: -data.quantity,
                    batchNumber: data.batchNumber,
                    patientId: medication.prescription.patientId,
                    encounterId: medication.prescription.encounterId,
                    performedBy: data.dispensedBy,
                    notes: `Dispensed: ${medication.medicationName}`,
                },
            });
        }

        await prisma.auditEvent.create({
            data: {
                entityType: 'PrescriptionMedication',
                entityId: data.medicationId,
                action: 'dispense',
                performedBy: data.dispensedBy,
                metadata: { batchNumber: data.batchNumber, quantity: data.quantity },
            },
        });

        // 💰 Auto-Billing: Add medication cost to patient bill
        try {
            const medName = medication.medicationName.toUpperCase().replace(/[\s()]+/g, '-');
            const tariff = await prisma.tariffMaster.findFirst({
                where: {
                    category: 'PHARMACY',
                    OR: [
                        { tariffCode: { contains: medName.slice(0, 8), mode: 'insensitive' } },
                        { description: { contains: medication.medicationName, mode: 'insensitive' } }
                    ],
                    isActive: true
                }
            });

            const qty = data.quantity || medication.quantity || 1;
            const unitPrice = tariff?.basePrice || 50; // Default ₹50 if not in tariff

            await addBillItem(
                medication.prescription.patientId,
                medication.prescription.encounterId,
                {
                    category: 'PHARMACY',
                    itemCode: tariff?.tariffCode || `MED-${medName.slice(0, 15)}`,
                    description: `${medication.medicationName} ${medication.dosage}`,
                    quantity: qty,
                    unitPrice,
                    tariffId: tariff?.id
                }
            );
        } catch (billingError) {
            console.warn('Pharmacy billing failed (non-blocking):', billingError);
        }

        return NextResponse.json({ message: 'Medication dispensed', pendingCount: pendingMeds });
    } catch (error) {
        console.error('Error dispensing medication:', error);
        return NextResponse.json({ error: 'Failed to dispense' }, { status: 500 });
    }
}
