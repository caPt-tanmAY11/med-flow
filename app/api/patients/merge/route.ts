import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { patientMergeSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

// POST /api/patients/merge - Merge two patients
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourcePatientId, targetPatientId, mergeReason } = patientMergeSchema.parse(body);

        if (sourcePatientId === targetPatientId) {
            return NextResponse.json(
                { error: 'Cannot merge a patient with itself' },
                { status: 400 }
            );
        }

        // Get both patients
        const [sourcePatient, targetPatient] = await Promise.all([
            prisma.patient.findUnique({
                where: { id: sourcePatientId },
                include: {
                    encounters: true,
                    allergies: true,
                    idDocuments: true,
                    insurancePolicies: true,
                },
            }),
            prisma.patient.findUnique({
                where: { id: targetPatientId },
            }),
        ]);

        if (!sourcePatient) {
            return NextResponse.json(
                { error: 'Source patient not found' },
                { status: 404 }
            );
        }

        if (!targetPatient) {
            return NextResponse.json(
                { error: 'Target patient not found' },
                { status: 404 }
            );
        }

        if (sourcePatient.mergedIntoPatientId) {
            return NextResponse.json(
                { error: 'Source patient is already merged' },
                { status: 400 }
            );
        }

        if (targetPatient.mergedIntoPatientId) {
            return NextResponse.json(
                { error: 'Target patient is already merged' },
                { status: 400 }
            );
        }

        // Perform merge in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create merge history record
            await tx.patientMergeHistory.create({
                data: {
                    sourcePatientId,
                    targetPatientId,
                    mergedBy: 'system', // TODO: Get from auth
                    mergeReason,
                    rollbackData: JSON.parse(JSON.stringify(sourcePatient)),
                },
            });

            // 2. Transfer encounters to target patient
            await tx.encounter.updateMany({
                where: { patientId: sourcePatientId },
                data: { patientId: targetPatientId },
            });

            // 3. Transfer allergies (avoid duplicates)
            for (const allergy of sourcePatient.allergies) {
                const existing = await tx.allergy.findFirst({
                    where: {
                        patientId: targetPatientId,
                        allergen: allergy.allergen,
                    },
                });
                if (!existing) {
                    await tx.allergy.update({
                        where: { id: allergy.id },
                        data: { patientId: targetPatientId },
                    });
                }
            }

            // 4. Transfer ID documents
            await tx.patientIdDocument.updateMany({
                where: { patientId: sourcePatientId },
                data: { patientId: targetPatientId },
            });

            // 5. Transfer insurance policies
            await tx.insurancePolicy.updateMany({
                where: { patientId: sourcePatientId },
                data: { patientId: targetPatientId },
            });

            // 6. Mark source patient as merged
            const mergedPatient = await tx.patient.update({
                where: { id: sourcePatientId },
                data: { mergedIntoPatientId: targetPatientId },
            });

            // 7. Create audit event
            await tx.auditEvent.create({
                data: {
                    entityType: 'Patient',
                    entityId: sourcePatientId,
                    action: 'merge',
                    performedBy: 'system', // TODO: Get from auth
                    metadata: {
                        targetPatientId,
                        mergeReason,
                        transferredEncounters: sourcePatient.encounters.length,
                        transferredAllergies: sourcePatient.allergies.length,
                    },
                },
            });

            return mergedPatient;
        });

        return NextResponse.json({
            message: 'Patients merged successfully',
            data: {
                sourcePatientId,
                targetPatientId,
                mergedAt: new Date().toISOString(),
            },
        });
    } catch (error) {
        console.error('Error merging patients:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to merge patients' },
            { status: 500 }
        );
    }
}
