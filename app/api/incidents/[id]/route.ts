import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

const investigationSchema = z.object({
    investigator: z.string(),
    findings: z.string().min(10),
});

// GET /api/incidents/[id]
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const incident = await prisma.incident.findUnique({
            where: { id },
            include: {
                investigations: { orderBy: { investigatedAt: 'desc' } },
                capa: { orderBy: { dueDate: 'asc' } },
            },
        });
        if (!incident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }
        return NextResponse.json({ data: incident });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// PUT /api/incidents/[id]
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, rootCause, resolvedBy } = body;

        const updateData: Prisma.IncidentUpdateInput = {};
        if (status) updateData.status = status;
        if (rootCause) updateData.rootCause = rootCause;
        if (status === 'resolved') {
            updateData.resolvedAt = new Date();
            updateData.resolvedBy = resolvedBy;
        }

        const incident = await prisma.incident.update({ where: { id }, data: updateData });
        return NextResponse.json({ data: incident });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/incidents/[id]
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');
        const body = await request.json();

        if (action === 'investigation') {
            const data = investigationSchema.parse(body);
            const investigation = await prisma.incidentInvestigation.create({
                data: { incidentId: id, investigator: data.investigator, findings: data.findings },
            });
            await prisma.incident.update({ where: { id }, data: { status: 'investigating' } });
            return NextResponse.json({ data: investigation }, { status: 201 });
        }

        if (action === 'capa') {
            const capa = await prisma.cAPA.create({
                data: {
                    incidentId: id,
                    capaType: body.capaType,
                    description: body.description,
                    assignedTo: body.assignedTo,
                    dueDate: new Date(body.dueDate),
                    status: 'open',
                },
            });
            return NextResponse.json({ data: capa }, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
