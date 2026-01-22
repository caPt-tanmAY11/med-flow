import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/incidents - Get incidents
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const severity = searchParams.get('severity');

        const where: Record<string, unknown> = {};
        if (status) where.status = status;
        if (severity) where.severity = severity;

        const incidents = await prisma.incident.findMany({
            where,
            orderBy: [{ severity: 'asc' }, { reportedAt: 'desc' }],
            take: 100,
        });

        return NextResponse.json({ data: incidents });
    } catch (error) {
        console.error('Error fetching incidents:', error);
        return NextResponse.json({ error: 'Failed to fetch incidents' }, { status: 500 });
    }
}

// POST /api/incidents - Create incident
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { incidentType, severity, location, description, reportedBy, patientId, encounterId } = body;

        if (!incidentType || !severity || !location || !description || !reportedBy) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const incident = await prisma.incident.create({
            data: {
                incidentType,
                severity,
                location,
                description,
                reportedBy,
                patientId,
                encounterId,
            },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'Incident',
                entityId: incident.id,
                action: 'create',
                performedBy: reportedBy,
            },
        });

        return NextResponse.json({ data: incident }, { status: 201 });
    } catch (error) {
        console.error('Error creating incident:', error);
        return NextResponse.json({ error: 'Failed to create incident' }, { status: 500 });
    }
}
