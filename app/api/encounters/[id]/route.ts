import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { encounterUpdateSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/encounters/[id] - Get a single encounter with full details
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        const encounter = await prisma.encounter.findUnique({
            where: { id },
            include: {
                patient: {
                    include: {
                        allergies: {
                            where: { isActive: true },
                        },
                        insurancePolicies: {
                            where: { isActive: true },
                        },
                    },
                },
                bedAssignments: {
                    include: {
                        bed: true,
                    },
                    orderBy: { startTime: 'desc' },
                },
                clinicalNotes: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                },
                vitalSigns: {
                    orderBy: { recordedAt: 'desc' },
                    take: 20,
                },
                prescriptions: {
                    include: {
                        medications: true,
                    },
                    orderBy: { prescribedAt: 'desc' },
                },
                orders: {
                    include: {
                        labResult: true,
                        radiologyResult: true,
                    },
                    orderBy: { orderedAt: 'desc' },
                },
                transfers: {
                    orderBy: { transferredAt: 'desc' },
                },
                diagnoses: true,
                procedures: true,
            },
        });

        if (!encounter) {
            return NextResponse.json(
                { error: 'Encounter not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: encounter });
    } catch (error) {
        console.error('Error fetching encounter:', error);
        return NextResponse.json(
            { error: 'Failed to fetch encounter' },
            { status: 500 }
        );
    }
}

// PUT /api/encounters/[id] - Update an encounter
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const data = encounterUpdateSchema.parse(body);

        const existingEncounter = await prisma.encounter.findUnique({
            where: { id },
        });

        if (!existingEncounter) {
            return NextResponse.json(
                { error: 'Encounter not found' },
                { status: 404 }
            );
        }

        // Build update data
        const updateData: Prisma.EncounterUpdateInput = {};

        if (data.status !== undefined) {
            updateData.status = data.status;
            // Set discharge time if being discharged
            if (data.status === 'DISCHARGED' && !existingEncounter.dischargeTime) {
                updateData.dischargeTime = new Date();
            }
        }
        if (data.primaryDoctorId !== undefined) updateData.primaryDoctorId = data.primaryDoctorId;
        if (data.department !== undefined) updateData.department = data.department;
        if (data.triageColor !== undefined) {
            updateData.triageColor = data.triageColor;
            if (!existingEncounter.triageTime) {
                updateData.triageTime = new Date();
            }
        }
        if (data.triageNotes !== undefined) updateData.triageNotes = data.triageNotes;
        if (data.triageBy !== undefined) updateData.triageBy = data.triageBy;
        if (data.currentLocation !== undefined) updateData.currentLocation = data.currentLocation;
        if (data.consultationStart !== undefined) updateData.consultationStart = data.consultationStart;
        if (data.consultationEnd !== undefined) updateData.consultationEnd = data.consultationEnd;
        if (data.dischargeTime !== undefined) updateData.dischargeTime = data.dischargeTime;
        if (data.medicoLegalFlag !== undefined) updateData.medicoLegalFlag = data.medicoLegalFlag;

        const encounter = await prisma.encounter.update({
            where: { id },
            data: updateData,
            include: {
                patient: {
                    select: {
                        id: true,
                        uhid: true,
                        name: true,
                    },
                },
                bedAssignments: {
                    where: { endTime: null },
                    include: {
                        bed: true,
                    },
                },
            },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'Encounter',
                entityId: encounter.id,
                action: 'update',
                performedBy: 'system', // TODO: Get from auth
                oldValues: existingEncounter as unknown as Prisma.JsonObject,
                newValues: encounter as unknown as Prisma.JsonObject,
            },
        });

        // If discharged, end any active bed assignments
        if (data.status === 'DISCHARGED') {
            await prisma.bedAssignment.updateMany({
                where: { encounterId: id, endTime: null },
                data: { endTime: new Date() },
            });

            // Update bed status to cleaning
            const activeBedAssignments = await prisma.bedAssignment.findMany({
                where: { encounterId: id },
                select: { bedId: true },
            });

            for (const assignment of activeBedAssignments) {
                await prisma.bed.update({
                    where: { id: assignment.bedId },
                    data: { status: 'CLEANING' },
                });
            }
        }

        return NextResponse.json({ data: encounter });
    } catch (error) {
        console.error('Error updating encounter:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to update encounter' },
            { status: 500 }
        );
    }
}
