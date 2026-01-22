import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { bedAssignmentSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/beds/[id] - Get a single bed
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        const bed = await prisma.bed.findUnique({
            where: { id },
            include: {
                assignments: {
                    orderBy: { startTime: 'desc' },
                    take: 10,
                    include: {
                        encounter: {
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
                        },
                    },
                },
            },
        });

        if (!bed) {
            return NextResponse.json(
                { error: 'Bed not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ data: bed });
    } catch (error) {
        console.error('Error fetching bed:', error);
        return NextResponse.json(
            { error: 'Failed to fetch bed' },
            { status: 500 }
        );
    }
}

// PUT /api/beds/[id] - Update bed status
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, lastCleanedBy } = body;

        const existingBed = await prisma.bed.findUnique({
            where: { id },
        });

        if (!existingBed) {
            return NextResponse.json(
                { error: 'Bed not found' },
                { status: 404 }
            );
        }

        const updateData: Prisma.BedUpdateInput = {};

        if (status) {
            updateData.status = status;
            // If marking as available after cleaning, update cleaned timestamp
            if (status === 'AVAILABLE' && existingBed.status === 'CLEANING') {
                updateData.lastCleanedAt = new Date();
                updateData.lastCleanedBy = lastCleanedBy || 'system';
            }
        }

        const bed = await prisma.bed.update({
            where: { id },
            data: updateData,
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Bed',
                entityId: bed.id,
                action: 'update',
                performedBy: 'system',
                oldValues: existingBed as unknown as Prisma.JsonObject,
                newValues: bed as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: bed });
    } catch (error) {
        console.error('Error updating bed:', error);
        return NextResponse.json(
            { error: 'Failed to update bed' },
            { status: 500 }
        );
    }
}

// POST /api/beds/[id]/assign - Assign a bed to an encounter
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const { id: bedId } = await context.params;
        const body = await request.json();
        const { encounterId, assignedBy } = bedAssignmentSchema.parse({
            ...body,
            bedId,
        });

        // Check if bed exists and is available
        const bed = await prisma.bed.findUnique({
            where: { id: bedId },
        });

        if (!bed) {
            return NextResponse.json(
                { error: 'Bed not found' },
                { status: 404 }
            );
        }

        if (bed.status !== 'AVAILABLE' && bed.status !== 'RESERVED') {
            return NextResponse.json(
                { error: 'Bed is not available' },
                { status: 400 }
            );
        }

        // Check if encounter exists and is active
        const encounter = await prisma.encounter.findUnique({
            where: { id: encounterId },
        });

        if (!encounter) {
            return NextResponse.json(
                { error: 'Encounter not found' },
                { status: 404 }
            );
        }

        if (encounter.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: 'Cannot assign bed to non-active encounter' },
                { status: 400 }
            );
        }

        // End any existing bed assignment for this encounter
        await prisma.bedAssignment.updateMany({
            where: { encounterId, endTime: null },
            data: { endTime: new Date() },
        });

        // Create new assignment
        const assignment = await prisma.bedAssignment.create({
            data: {
                encounterId,
                bedId,
                assignedBy,
            },
            include: {
                bed: true,
                encounter: {
                    include: {
                        patient: {
                            select: { uhid: true, name: true },
                        },
                    },
                },
            },
        });

        // Update bed status to occupied
        await prisma.bed.update({
            where: { id: bedId },
            data: { status: 'OCCUPIED' },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'BedAssignment',
                entityId: assignment.id,
                action: 'create',
                performedBy: assignedBy || 'system',
                newValues: assignment as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: assignment }, { status: 201 });
    } catch (error) {
        console.error('Error assigning bed:', error);
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: 'Failed to assign bed' },
            { status: 500 }
        );
    }
}
