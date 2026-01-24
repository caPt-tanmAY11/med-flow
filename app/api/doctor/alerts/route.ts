
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Check for recent Doctor Calls (last 5 minutes)
export async function GET(request: NextRequest) {
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        const alerts = await prisma.auditEvent.findMany({
            where: {
                action: 'doctor_called',
                performedAt: { gte: fiveMinutesAgo }
            },
            take: 5,
            orderBy: { performedAt: 'desc' }
        });

        return NextResponse.json({ data: alerts });
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
