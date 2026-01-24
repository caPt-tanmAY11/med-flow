import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const prescriptionSchema = z.object({
    encounterId: z.string().uuid(),
    patientId: z.string().uuid(),
    prescribedBy: z.string(),
    prescriptionImageUrl: z.string().nullable().optional(),
    medications: z.array(z.object({
        medicationName: z.string(),
        dosage: z.string(),
        frequency: z.string(),
        route: z.string(),
        duration: z.string(),
        instructions: z.string().optional(),
        quantity: z.number().int().optional(),
    })),
});

const dispenseSchema = z.object({
    prescriptionMedicationId: z.string().uuid(),
    dispensedBy: z.string(),
    batchNumber: z.string().optional(),
});

// GET /api/pharmacy - List prescriptions
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const patientId = searchParams.get('patientId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: Prisma.PrescriptionWhereInput = {};
        if (status) where.status = status;
        if (patientId) where.patientId = patientId;

        const [prescriptions, total] = await Promise.all([
            prisma.prescription.findMany({
                where,
                orderBy: { prescribedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    medications: true,
                    patient: {
                        select: { id: true, uhid: true, name: true },
                    },
                    encounter: {
                        select: { id: true, type: true, department: true },
                    },
                },
            }),
            prisma.prescription.count({ where }),
        ]);

        // Get pending count
        const pendingCount = await prisma.prescriptionMedication.count({
            where: { isDispensed: false },
        });

        return NextResponse.json({
            data: prescriptions,
            stats: { pendingDispense: pendingCount },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
    }
}

// POST /api/pharmacy - Create prescription
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = prescriptionSchema.parse(body);

        // Check patient allergies for drug interactions
        const patient = await prisma.patient.findUnique({
            where: { id: data.patientId },
            include: { allergies: { where: { isActive: true, allergenType: 'drug' } } },
        });

        const allergyAlerts: { medication: string; allergen: string }[] = [];
        if (patient?.allergies) {
            for (const med of data.medications) {
                for (const allergy of patient.allergies) {
                    if (med.medicationName.toLowerCase().includes(allergy.allergen.toLowerCase())) {
                        allergyAlerts.push({ medication: med.medicationName, allergen: allergy.allergen });
                    }
                }
            }
        }

        const prescription = await prisma.prescription.create({
            data: {
                encounterId: data.encounterId,
                patientId: data.patientId,
                prescribedBy: data.prescribedBy,
                prescriptionImageUrl: data.prescriptionImageUrl,
                medications: {
                    create: data.medications.map(m => ({
                        medicationName: m.medicationName,
                        dosage: m.dosage,
                        frequency: m.frequency,
                        route: m.route,
                        duration: m.duration,
                        instructions: m.instructions,
                        quantity: m.quantity,
                    })),
                },
            },
            include: { medications: true },
        });

        // Create allergy alerts
        for (const alert of allergyAlerts) {
            await prisma.safetyAlert.create({
                data: {
                    patientId: data.patientId,
                    encounterId: data.encounterId,
                    alertType: 'allergy',
                    severity: 'critical',
                    message: `Drug allergy alert: ${alert.medication} - Patient allergic to ${alert.allergen}`,
                    context: { prescriptionId: prescription.id },
                },
            });
        }

        await prisma.auditEvent.create({
            data: {
                entityType: 'Prescription',
                entityId: prescription.id,
                action: 'create',
                performedBy: data.prescribedBy,
                newValues: prescription as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({
            data: prescription,
            allergyAlerts: allergyAlerts.length > 0 ? allergyAlerts : undefined,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating prescription:', error);
        return NextResponse.json({ error: 'Failed to create prescription' }, { status: 500 });
    }
}
