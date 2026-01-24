import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { addBillItem, getMedicationPrice } from '@/lib/billing-utils';

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
                    include: {
                        patient: true,
                        encounter: true,
                    },
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

        // AUTO-BILLING: Add medication charge to patient's bill
        try {
            const medicationPrice = await getMedicationPrice(medication.medicationName);
            const quantity = medication.quantity || data.quantity || 1;

            await addBillItem({
                encounterId: medication.prescription.encounterId,
                patientId: medication.prescription.patientId,
                category: 'pharmacy',
                department: 'PHARMACY',
                itemCode: `MED-${medication.id.substring(0, 8)}`,
                description: `${medication.medicationName} - ${medication.dosage} x ${quantity}`,
                quantity: quantity,
                unitPrice: medicationPrice,
            });
        } catch (billingError) {
            console.error('Auto-billing error (non-fatal):', billingError);
            // Continue even if billing fails
        }

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

        return NextResponse.json({ message: 'Medication dispensed', pendingCount: pendingMeds });
    } catch (error) {
        console.error('Error dispensing medication:', error);
        return NextResponse.json({ error: 'Failed to dispense' }, { status: 500 });
    }
}

