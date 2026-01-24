import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/nursing/care-plans - Get care plans for patient/encounter
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const patientId = searchParams.get('patientId');

        const carePlans = await prisma.carePlan.findMany({
            where: {
                ...(encounterId ? { encounterId } : {}),
                ...(patientId ? { patientId } : {}),
                status: 'active',
            },
            orderBy: { updatedAt: 'desc' },
        });

        return NextResponse.json({ data: carePlans });
    } catch (error) {
        console.error('Error fetching care plans:', error);
        return NextResponse.json({ error: 'Failed to fetch care plans' }, { status: 500 });
    }
}

// POST /api/nursing/care-plans - Create or update care plan
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { encounterId, patientId, goals, interventions, dailySchedule, createdBy } = body;

        // Check if care plan exists for this encounter
        const existingPlan = await prisma.carePlan.findFirst({
            where: { encounterId, status: 'active' },
        });

        let carePlan;

        if (existingPlan) {
            // Update existing care plan
            carePlan = await prisma.carePlan.update({
                where: { id: existingPlan.id },
                data: {
                    goals,
                    interventions: {
                        ...((existingPlan.interventions as object) || {}),
                        ...interventions,
                        dailySchedule,
                    },
                    updatedAt: new Date(),
                },
            });
        } else {
            // Create new care plan
            carePlan = await prisma.carePlan.create({
                data: {
                    encounterId,
                    patientId,
                    goals,
                    interventions: { ...interventions, dailySchedule },
                    createdBy,
                },
            });
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'CarePlan',
                entityId: carePlan.id,
                action: existingPlan ? 'update' : 'create',
                performedBy: createdBy,
                metadata: { encounterId, patientId },
            },
        });

        return NextResponse.json({ data: carePlan }, { status: existingPlan ? 200 : 201 });
    } catch (error) {
        console.error('Error managing care plan:', error);
        return NextResponse.json({ error: 'Failed to manage care plan' }, { status: 500 });
    }
}

// PUT /api/nursing/care-plans - Update care plan status
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, status, updatedBy } = body;

        const carePlan = await prisma.carePlan.update({
            where: { id },
            data: { status },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'CarePlan',
                entityId: id,
                action: 'status_update',
                performedBy: updatedBy,
                metadata: { newStatus: status },
            },
        });

        return NextResponse.json({ data: carePlan });
    } catch (error) {
        console.error('Error updating care plan:', error);
        return NextResponse.json({ error: 'Failed to update care plan' }, { status: 500 });
    }
}
