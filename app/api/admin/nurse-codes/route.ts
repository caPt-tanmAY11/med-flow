import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/nurse-codes - Get daily codes (admin only)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const dateStr = searchParams.get('date');

        const targetDate = dateStr ? new Date(dateStr) : new Date();
        targetDate.setHours(0, 0, 0, 0);

        const tomorrow = new Date(targetDate);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const codes = await prisma.nurseDailyCode.findMany({
            where: {
                validDate: {
                    gte: targetDate,
                    lt: tomorrow,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ data: codes });
    } catch (error) {
        console.error('Error fetching codes:', error);
        return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
    }
}

// POST /api/admin/nurse-codes - Create daily code (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { code, createdBy } = body;

        if (!code || code.length !== 4 || !/^\d{4}$/.test(code)) {
            return NextResponse.json({ error: 'Code must be exactly 4 digits' }, { status: 400 });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Deactivate any existing codes for today
        await prisma.nurseDailyCode.updateMany({
            where: {
                validDate: {
                    gte: today,
                    lt: tomorrow,
                },
                isActive: true,
            },
            data: { isActive: false },
        });

        // Create new code
        const dailyCode = await prisma.nurseDailyCode.create({
            data: {
                code,
                validDate: today,
                createdBy,
            },
        });

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'NurseDailyCode',
                entityId: dailyCode.id,
                action: 'create',
                performedBy: createdBy,
                metadata: { validDate: today.toISOString() },
            },
        });

        return NextResponse.json({ data: dailyCode }, { status: 201 });
    } catch (error) {
        console.error('Error creating code:', error);
        return NextResponse.json({ error: 'Failed to create code' }, { status: 500 });
    }
}

// DELETE /api/admin/nurse-codes - Deactivate code
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Code ID required' }, { status: 400 });
        }

        await prisma.nurseDailyCode.update({
            where: { id },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deactivating code:', error);
        return NextResponse.json({ error: 'Failed to deactivate code' }, { status: 500 });
    }
}
