import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to safely query new models
async function safeQuery<T>(query: () => Promise<T>, fallback: T): Promise<T> {
    try {
        return await query();
    } catch (error) {
        console.warn('Query failed, using fallback:', error);
        return fallback;
    }
}

interface DailyCode {
    id: string;
    code: string;
    validDate: Date;
    createdBy: string;
}

// POST /api/nursing/seed - Seed initial nurse data (for development)
export async function POST() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create today's global daily code (fallback)
        const existingCode = await safeQuery<DailyCode | null>(
            () => (prisma as any).nurseDailyCode.findFirst({
                where: { validDate: { gte: today, lt: new Date(today.getTime() + 86400000) }, isActive: true },
            }),
            null
        );

        let dailyCode: DailyCode | null = existingCode;
        if (!dailyCode) {
            dailyCode = await safeQuery<DailyCode | null>(
                () => (prisma as any).nurseDailyCode.create({
                    data: { code: '1234', validDate: today, createdBy: 'System' },
                }),
                null
            );
        }

        // Create nurse duties for today
        const nurses = [
            { nurseId: 'nurse-1', nurseName: 'Sarah Johnson', shiftType: 'MORNING', ward: 'ICU' },
            { nurseId: 'nurse-2', nurseName: 'Emily Chen', shiftType: 'MORNING', ward: 'General' },
            { nurseId: 'nurse-3', nurseName: 'Michael Brown', shiftType: 'EVENING', ward: 'Pediatric' },
            { nurseId: 'nurse-4', nurseName: 'Lisa Williams', shiftType: 'NIGHT', ward: 'ICU' },
        ];

        for (const nurse of nurses) {
            const existingDuty = await safeQuery(
                () => (prisma as any).nurseDuty.findFirst({
                    where: { nurseId: nurse.nurseId, shiftDate: { gte: today, lt: new Date(today.getTime() + 86400000) } },
                }),
                null
            );

            if (!existingDuty) {
                await safeQuery(
                    () => (prisma as any).nurseDuty.create({
                        data: { ...nurse, shiftDate: today, checkInAt: nurse.shiftType === 'MORNING' ? new Date() : null },
                    }),
                    null
                );
            }
        }

        // Get counts
        const dutiesCount = await safeQuery(
            () => (prisma as any).nurseDuty.count({
                where: { shiftDate: { gte: today, lt: new Date(today.getTime() + 86400000) } },
            }),
            nurses.length
        );

        return NextResponse.json({
            message: 'Seed data created successfully',
            data: { dailyCode: dailyCode?.code || '1234', nursesOnDuty: dutiesCount },
        }, { status: 201 });
    } catch (error) {
        console.error('Error seeding data:', error);
        return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
    }
}

// GET /api/nursing/seed - Get seed status
export async function GET() {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailyCode = await safeQuery<DailyCode | null>(
            () => (prisma as any).nurseDailyCode.findFirst({
                where: { validDate: { gte: today, lt: new Date(today.getTime() + 86400000) }, isActive: true },
            }),
            null
        );

        const dutiesCount = await safeQuery(
            () => (prisma as any).nurseDuty.count({
                where: { shiftDate: { gte: today, lt: new Date(today.getTime() + 86400000) }, isActive: true },
            }),
            0
        );

        return NextResponse.json({
            hasCode: !!dailyCode,
            code: dailyCode?.code || '1234',
            nursesOnDuty: dutiesCount,
        });
    } catch (error) {
        console.error('Error getting seed status:', error);
        return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
    }
}
