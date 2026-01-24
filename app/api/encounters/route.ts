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
