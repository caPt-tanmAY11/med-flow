import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/alerts - Get safety alerts
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const acknowledged = searchParams.get('acknowledged');
        const severity = searchParams.get('severity');
        const patientId = searchParams.get('patientId');

        const where: Record<string, unknown> = {};
        if (acknowledged === 'false') where.acknowledgedAt = null;
        if (acknowledged === 'true') where.acknowledgedAt = { not: null };
        if (severity) where.severity = severity;
        if (patientId) where.patientId = patientId;

        const alerts = await prisma.safetyAlert.findMany({
            where,
            orderBy: [{ severity: 'asc' }, { triggeredAt: 'desc' }],
            take: 100,
            include: {
                encounter: {
                    include: {
                        patient: { select: { uhid: true, name: true } },
                    },
                },
            },
        });

        return NextResponse.json({ data: alerts });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
    }
}

// POST /api/alerts - Create safety alert
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patientId, encounterId, alertType, severity, message, context } = body;

        if (!patientId || !alertType || !severity || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const alert = await prisma.safetyAlert.create({
            data: {
                patientId,
                encounterId,
                alertType,
                severity,
                message,
                context,
            },
        });

        return NextResponse.json({ data: alert }, { status: 201 });
    } catch (error) {
        console.error('Error creating alert:', error);
        return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 });
    }
}
