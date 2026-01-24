import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/doctor/appointments - Get appointments for doctor's schedule
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const doctorId = searchParams.get('doctorId');
        const date = searchParams.get('date');
        const status = searchParams.get('status');

        const where: {
            doctorId?: string;
            status?: string;
            scheduledAt?: { gte?: Date; lte?: Date };
        } = {};

        if (doctorId) where.doctorId = doctorId;
        if (status) where.status = status;

        // Default to today's appointments if no date specified
        if (date) {
            const startDate = new Date(date);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(date);
            endDate.setHours(23, 59, 59, 999);
            where.scheduledAt = { gte: startDate, lte: endDate };
        } else {
            // Get today and next 7 days
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            where.scheduledAt = { gte: today, lte: nextWeek };
        }

        const appointments = await prisma.appointment.findMany({
            where,
            orderBy: { scheduledAt: 'asc' },
            include: {
                patient: {
                    select: {
                        id: true,
                        uhid: true,
                        name: true,
                        gender: true,
                        dob: true,
                        contact: true,
                    },
                },
            },
        });

        // Group by date
        const groupedByDate: Record<string, typeof appointments> = {};
        appointments.forEach(apt => {
            const dateKey = new Date(apt.scheduledAt).toISOString().split('T')[0];
            if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
            groupedByDate[dateKey].push(apt);
        });

        // Get counts by status
        const statusCounts = await prisma.appointment.groupBy({
            by: ['status'],
            where: {
                scheduledAt: where.scheduledAt,
                ...(doctorId ? { doctorId } : {}),
            },
            _count: { id: true },
        });

        return NextResponse.json({
            appointments,
            groupedByDate,
            stats: {
                total: appointments.length,
                byStatus: statusCounts.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
            },
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
    }
}
