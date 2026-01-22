import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { orderSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

// GET /api/orders - List orders with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const encounterId = searchParams.get('encounterId');
        const patientId = searchParams.get('patientId');
        const orderType = searchParams.get('orderType');
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: Prisma.OrderWhereInput = {};
        if (encounterId) where.encounterId = encounterId;
        if (patientId) where.patientId = patientId;
        if (orderType) where.orderType = orderType;
        if (status) where.status = status;
        if (priority) where.priority = priority as 'STAT' | 'URGENT' | 'ROUTINE';

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where,
                orderBy: [{ priority: 'asc' }, { orderedAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    sample: true,
                    labResult: true,
                    radiologyResult: true,
                    encounter: {
                        include: {
                            patient: {
                                select: { id: true, uhid: true, name: true },
                            },
                        },
                    },
                },
            }),
            prisma.order.count({ where }),
        ]);

        return NextResponse.json({
            data: orders,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }
}

// POST /api/orders - Create a new order
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = orderSchema.parse(body);

        // Check for duplicate orders
        const existingOrder = await prisma.order.findFirst({
            where: {
                encounterId: data.encounterId,
                orderCode: data.orderCode,
                status: { in: ['ordered', 'collected', 'processing'] },
            },
        });

        if (existingOrder) {
            // Create duplicate order warning
            await prisma.safetyAlert.create({
                data: {
                    patientId: data.patientId,
                    encounterId: data.encounterId,
                    alertType: 'duplicate-order',
                    severity: 'warning',
                    message: `Duplicate order detected: ${data.orderName}`,
                    context: { existingOrderId: existingOrder.id },
                },
            });
        }

        const order = await prisma.order.create({
            data: {
                encounterId: data.encounterId,
                patientId: data.patientId,
                orderType: data.orderType,
                orderCode: data.orderCode,
                orderName: data.orderName,
                priority: data.priority,
                orderedBy: data.orderedBy,
            },
            include: {
                encounter: {
                    include: {
                        patient: { select: { uhid: true, name: true } },
                    },
                },
            },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Order',
                entityId: order.id,
                action: 'create',
                performedBy: data.orderedBy,
                newValues: order as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({
            data: order,
            warning: existingOrder ? 'Duplicate order detected' : undefined,
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating order:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
