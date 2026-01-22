import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/orders/[id]
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                sample: true,
                labResult: true,
                radiologyResult: true,
                encounter: {
                    include: {
                        patient: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ data: order });
    } catch (error) {
        console.error('Error fetching order:', error);
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
    }
}

// PUT /api/orders/[id] - Update order status
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { status, updatedBy } = body;

        const existingOrder = await prisma.order.findUnique({ where: { id } });
        if (!existingOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const order = await prisma.order.update({
            where: { id },
            data: { status },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Order',
                entityId: order.id,
                action: 'update',
                performedBy: updatedBy || 'system',
                oldValues: { status: existingOrder.status } as Prisma.JsonObject,
                newValues: { status: order.status } as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: order });
    } catch (error) {
        console.error('Error updating order:', error);
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
    }
}

// DELETE /api/orders/[id] - Cancel order
export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const cancelledBy = searchParams.get('cancelledBy') || 'system';

        const order = await prisma.order.findUnique({ where: { id } });
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'completed') {
            return NextResponse.json({ error: 'Cannot cancel completed order' }, { status: 400 });
        }

        await prisma.order.update({
            where: { id },
            data: { status: 'cancelled' },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Order',
                entityId: id,
                action: 'cancel',
                performedBy: cancelledBy,
                metadata: { previousStatus: order.status },
            },
        });

        return NextResponse.json({ message: 'Order cancelled' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
    }
}
