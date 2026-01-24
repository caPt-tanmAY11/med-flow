import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { billServiceByTariff, addBillItem } from '@/lib/billing';

const labResultSchema = z.object({
    orderId: z.string().uuid(),
    resultedBy: z.string(),
    result: z.record(z.any()),
    normalRange: z.string().optional(),
    interpretation: z.string().optional(),
    isCritical: z.boolean().default(false),
});

// GET /api/lab - List lab orders and results
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const isCritical = searchParams.get('isCritical');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const orderWhere: Prisma.OrderWhereInput = {
            orderType: 'lab',
        };
        if (status) orderWhere.status = status;
        if (priority) orderWhere.priority = priority as 'STAT' | 'URGENT' | 'ROUTINE';

        const [orders, total] = await Promise.all([
            prisma.order.findMany({
                where: orderWhere,
                orderBy: [{ priority: 'asc' }, { orderedAt: 'desc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    sample: true,
                    labResult: true,
                    encounter: {
                        include: {
                            patient: {
                                select: { id: true, uhid: true, name: true, gender: true, dob: true },
                            },
                        },
                    },
                },
            }),
            prisma.order.count({ where: orderWhere }),
        ]);

        // Summary stats
        const stats = await prisma.order.groupBy({
            by: ['status'],
            where: { orderType: 'lab' },
            _count: { id: true },
        });

        const criticalCount = await prisma.labResult.count({
            where: { isCritical: true, verifiedAt: null },
        });

        return NextResponse.json({
            data: orders,
            stats: {
                byStatus: stats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
                criticalUnverified: criticalCount,
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching lab orders:', error);
        return NextResponse.json({ error: 'Failed to fetch lab orders' }, { status: 500 });
    }
}

// POST /api/lab - Enter lab result
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = labResultSchema.parse(body);

        const order = await prisma.order.findUnique({
            where: { id: data.orderId },
            include: { encounter: true },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.orderType !== 'lab') {
            return NextResponse.json({ error: 'Order is not a lab order' }, { status: 400 });
        }

        const labResult = await prisma.labResult.create({
            data: {
                orderId: data.orderId,
                resultedBy: data.resultedBy,
                result: data.result as Prisma.JsonObject,
                normalRange: data.normalRange,
                interpretation: data.interpretation,
                isCritical: data.isCritical,
            },
        });

        // Update order status
        await prisma.order.update({
            where: { id: data.orderId },
            data: { status: 'completed' },
        });

        // Create critical value alert if needed
        if (data.isCritical && order.encounter) {
            await prisma.safetyAlert.create({
                data: {
                    patientId: order.encounter.patientId,
                    encounterId: order.encounterId,
                    alertType: 'critical-lab',
                    severity: 'critical',
                    message: `Critical lab result: ${order.orderName}`,
                    context: { labResultId: labResult.id, result: data.result },
                },
            });
        }

        await prisma.auditEvent.create({
            data: {
                entityType: 'LabResult',
                entityId: labResult.id,
                action: 'create',
                performedBy: data.resultedBy,
                newValues: labResult as unknown as Prisma.JsonObject,
            },
        });

        // 📊 Auto-Billing: Charge for lab test
        if (order.encounter) {
            try {
                const testCode = order.orderName?.toUpperCase().replace(/[\s()]+/g, '-') || '';
                const tariffCode = `LAB-${testCode.slice(0, 10)}`;

                // Try to find matching tariff, otherwise bill manually
                const tariff = await prisma.tariffMaster.findFirst({
                    where: {
                        category: 'LAB',
                        OR: [
                            { tariffCode: { contains: testCode.slice(0, 5), mode: 'insensitive' } },
                            { description: { contains: order.orderName || '', mode: 'insensitive' } }
                        ],
                        isActive: true
                    }
                });

                if (tariff) {
                    await billServiceByTariff(order.encounter.patientId, order.encounterId, tariff.tariffCode);
                } else {
                    // Default lab test price
                    await addBillItem(order.encounter.patientId, order.encounterId, {
                        category: 'LAB',
                        itemCode: order.orderName || 'LAB-TEST',
                        description: order.orderName || 'Laboratory Test',
                        quantity: 1,
                        unitPrice: 300 // Default lab price
                    });
                }
            } catch (billingError) {
                console.warn('Lab billing failed (non-blocking):', billingError);
            }
        }

        return NextResponse.json({ data: labResult }, { status: 201 });
    } catch (error) {
        console.error('Error creating lab result:', error);
        return NextResponse.json({ error: 'Failed to create lab result' }, { status: 500 });
    }
}
