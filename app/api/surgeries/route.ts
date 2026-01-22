import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/surgeries - List surgeries
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const date = searchParams.get('date');
        const otRoom = searchParams.get('otRoom');

        const where: Prisma.SurgeryWhereInput = {};
        if (status) where.status = status;
        if (otRoom) where.otRoom = otRoom;
        if (date) {
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);
            where.scheduledDate = { gte: startDate, lt: endDate };
        }

        const surgeries = await prisma.surgery.findMany({
            where,
            orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
            include: {
                surgeryTeam: true,
                checklists: true,
                encounter: {
                    include: { patient: { select: { uhid: true, name: true, gender: true, dob: true } } },
                },
            },
        });

        return NextResponse.json({ data: surgeries });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/surgeries - Schedule surgery
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { patientId, encounterId, procedureName, procedureCode, scheduledDate, scheduledTime, estimatedDuration, otRoom, team } = body;

        const surgery = await prisma.surgery.create({
            data: {
                patientId,
                encounterId,
                procedureName,
                procedureCode,
                scheduledDate: new Date(scheduledDate),
                scheduledTime,
                estimatedDuration: parseInt(estimatedDuration),
                otRoom,
                surgeryTeam: team ? {
                    create: team.map((t: { staffId: string; staffName: string; role: string }) => ({
                        staffId: t.staffId,
                        staffName: t.staffName,
                        role: t.role,
                    })),
                } : undefined,
            },
            include: { surgeryTeam: true },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Surgery',
                entityId: surgery.id,
                action: 'create',
                performedBy: 'system',
                newValues: surgery as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: surgery }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
