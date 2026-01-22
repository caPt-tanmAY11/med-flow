import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/audit - List audit events
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');
        const performedBy = searchParams.get('performedBy');
        const action = searchParams.get('action');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: Prisma.AuditEventWhereInput = {};
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = entityId;
        if (performedBy) where.performedBy = { contains: performedBy, mode: 'insensitive' };
        if (action) where.action = action;
        if (fromDate || toDate) {
            where.performedAt = {};
            if (fromDate) where.performedAt.gte = new Date(fromDate);
            if (toDate) where.performedAt.lte = new Date(toDate);
        }

        const [events, total] = await Promise.all([
            prisma.auditEvent.findMany({
                where,
                orderBy: { performedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditEvent.count({ where }),
        ]);

        return NextResponse.json({
            data: events,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
