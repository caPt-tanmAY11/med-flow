import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/alerts/[id] - Acknowledge alert
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { acknowledgedBy, overrideReason } = body;

        const alert = await prisma.safetyAlert.update({
            where: { id },
            data: {
                acknowledgedBy,
                acknowledgedAt: new Date(),
                overrideReason,
            },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'SafetyAlert',
                entityId: id,
                action: 'acknowledge',
                performedBy: acknowledgedBy || 'system',
                metadata: { overrideReason },
            },
        });

        return NextResponse.json({ data: alert });
    } catch (error) {
        console.error('Error acknowledging alert:', error);
        return NextResponse.json({ error: 'Failed to acknowledge alert' }, { status: 500 });
    }
}
