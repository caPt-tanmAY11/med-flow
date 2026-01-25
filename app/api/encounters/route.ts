import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encounterCreateSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

// GET /api/encounters - List encounters with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const department = searchParams.get('department');
        const triageColor = searchParams.get('triageColor');
        const doctorId = searchParams.get('doctorId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const skip = (page - 1) * limit;

        const where: Prisma.EncounterWhereInput = {};

        if (patientId) where.patientId = patientId;
        if (status) where.status = status as 'ACTIVE' | 'TRANSFERRED' | 'DISCHARGED' | 'CANCELLED';
        if (type) where.type = type as 'OPD' | 'IPD' | 'EMERGENCY';
        if (department) where.department = { contains: department, mode: 'insensitive' };
        if (triageColor) where.triageColor = triageColor as 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
        if (doctorId) where.primaryDoctorId = doctorId;

        const [encounters, total] = await Promise.all([
            prisma.encounter.findMany({
                where,
                skip,
                take: limit,
                orderBy: { arrivalTime: 'desc' },
                include: {
                    patient: {
                        select: {
                            id: true,
                            uhid: true,
                            name: true,
                            gender: true,
                            dob: true,
                            contact: true,
                            allergies: {
                                where: { isActive: true },
                                select: { allergen: true, severity: true },
                            },
                        },
                    },
                    bedAssignments: {
                        where: { endTime: null },
                        include: {
                            bed: {
                                select: { id: true, bedNumber: true, ward: true, type: true },
                            },
                        },
                    },
                    _count: {
                        select: {
                            clinicalNotes: true,
                            vitalSigns: true,
                            orders: true,
                        },
                    },
                },
            }),
            prisma.encounter.count({ where }),
        ]);

        return NextResponse.json({
            data: encounters,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching encounters:', error);
        return NextResponse.json(
            { error: 'Failed to fetch encounters' },
            { status: 500 }
        );
    }
}

// POST /api/encounters - Create a new encounter
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = encounterCreateSchema.parse(body);

        // Check if patient exists
        const patient = await prisma.patient.findUnique({
            where: { id: data.patientId },
            include: {
                allergies: {
                    where: { isActive: true },
                },
            },
        });

        if (!patient) {
            return NextResponse.json(
                { error: 'Patient not found' },
                { status: 404 }
            );
        }

        if (patient.mergedIntoPatientId) {
            return NextResponse.json(
                { error: 'Cannot create encounter for merged patient' },
                { status: 400 }
            );
        }

        // Check for active encounters of same type
        const activeEncounter = await prisma.encounter.findFirst({
            where: {
                patientId: data.patientId,
                type: data.type,
                status: 'ACTIVE',
            },
        });

        if (activeEncounter) {
            return NextResponse.json(
                {
                    error: `Patient already has an active ${data.type} encounter`,
                    existingEncounterId: activeEncounter.id,
                },
                { status: 409 }
            );
        }

        // Handle IPD Bed Assignment Logic
        let selectedBedId: string | undefined;
        if (data.type === 'IPD' && data.ward) {
            // Find all available beds in the selected ward
            const availableBeds = await prisma.bed.findMany({
                where: {
                    ward: data.ward,
                    status: 'AVAILABLE'
                }
            });

            if (availableBeds.length === 0) {
                return NextResponse.json(
                    { error: `No beds available in ${data.ward}. Please select a different ward.` },
                    { status: 400 }
                );
            }

            // Randomly select one available bed
            const randomBed = availableBeds[Math.floor(Math.random() * availableBeds.length)];
            selectedBedId = randomBed.id;
        }

        const encounter = await prisma.encounter.create({
            data: {
                patientId: data.patientId,
                type: data.type,
                primaryDoctorId: data.primaryDoctorId,
                department: data.department,
                triageColor: data.triageColor,
                triageNotes: data.triageNotes,
                triageTime: data.triageColor ? new Date() : null,
                medicoLegalFlag: data.medicoLegalFlag,
                arrivalTime: new Date(),
            },
            include: {
                patient: {
                    select: {
                        id: true,
                        uhid: true,
                        name: true,
                        gender: true,
                        dob: true,
                    },
                },
            },
        });

        // If a bed was selected, assign it and update status
        if (selectedBedId) {
            await prisma.$transaction([
                prisma.bed.update({
                    where: { id: selectedBedId },
                    data: { status: 'OCCUPIED' }
                }),
                prisma.bedAssignment.create({
                    data: {
                        encounterId: encounter.id,
                        bedId: selectedBedId,
                        startTime: new Date()
                    }
                })
            ]);
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'Encounter',
                entityId: encounter.id,
                action: 'create',
                performedBy: 'system', // TODO: Get from auth
                newValues: encounter as unknown as Prisma.JsonObject,
            },
        });

        // Notify the assigned doctor if one exists
        if (data.primaryDoctorId) {
            try {
                await prisma.notification.create({
                    data: {
                        userId: data.primaryDoctorId,
                        title: 'New Patient Assigned',
                        message: `Patient ${patient.name} (${patient.uhid}) has been registered and assigned to you.`,
                        type: 'info',
                        link: '/opd',
                        encounterId: encounter.id,
                        patientId: patient.id,
                    },
                });

                // Add to OPD Queue if type is OPD
                if (data.type === 'OPD') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const lastEntry = await (prisma as any).oPDQueue.findFirst({
                        where: {
                            doctorId: data.primaryDoctorId,
                            createdAt: {
                                gte: today
                            }
                        },
                        orderBy: {
                            tokenNumber: 'desc'
                        }
                    });

                    const newTokenNumber = (lastEntry?.tokenNumber || 0) + 1;

                    await (prisma as any).oPDQueue.create({
                        data: {
                            patientId: data.patientId,
                            doctorId: data.primaryDoctorId,
                            tokenNumber: newTokenNumber,
                            status: 'WAITING'
                        }
                    });
                }

            } catch (error) {
                console.error('Failed to create notification or queue entry:', error);
                // Don't fail the request if notification/queue fails
            }
        }

        // Create Clinical Note from OCR if provided
        // We use 'any' cast for body because we haven't updated the Zod schema yet, 
        // but we want to handle these extra fields.
        const requestBody = body as any;
        if (requestBody.extractedText) {
            try {
                await prisma.clinicalNote.create({
                    data: {
                        encounterId: encounter.id,
                        patientId: patient.id,
                        noteType: requestBody.fileType || 'prescription',
                        content: requestBody.extractedText,
                        authorId: 'system', // Or current user if we had auth context here
                        authorRole: 'SYSTEM',
                    }
                });
            } catch (error) {
                console.error('Failed to create clinical note from OCR:', error);
            }
        }

        // Return with allergy alerts if any
        return NextResponse.json({
            data: encounter,
            alerts: patient.allergies.length > 0 ? {
                type: 'allergy',
                message: `Patient has ${patient.allergies.length} active allergies`,
                allergies: patient.allergies.map(a => ({
                    allergen: a.allergen,
                    severity: a.severity,
                })),
            } : undefined,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating encounter:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to create encounter' },
            { status: 500 }
        );
    }
}
