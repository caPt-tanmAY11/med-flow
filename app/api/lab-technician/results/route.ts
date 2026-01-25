import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Validation schema for result entry
const resultSchema = z.object({
    orderId: z.string().uuid(),
    resultData: z.record(z.any()), // Dynamic based on test fields
    isCritical: z.boolean().default(false),
    interpretation: z.string().optional(),
    notes: z.string().optional(),
    resultedBy: z.string(),
});

// POST /api/lab-technician/results - Submit comprehensive result
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = resultSchema.parse(body);

        // Get order with test result fields
        const order = await prisma.labTestOrder.findUnique({
            where: { id: data.orderId },
            include: {
                test: {
                    include: {
                        resultFields: true,
                    },
                },
                patient: {
                    select: { id: true, uhid: true, name: true },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.status === 'completed') {
            return NextResponse.json({ error: 'Result already submitted for this order' }, { status: 400 });
        }

        // Validate required fields are present
        const requiredFields = order.test.resultFields.filter(f => f.isRequired);
        const missingFields = requiredFields.filter(f => !(f.fieldName in data.resultData));

        if (missingFields.length > 0) {
            return NextResponse.json({
                error: 'Missing required result fields',
                missingFields: missingFields.map(f => f.fieldLabel),
            }, { status: 400 });
        }

        // Check for abnormal values
        const abnormalValues: Array<{ field: string; value: number | string; normalRange: string }> = [];
        for (const field of order.test.resultFields) {
            const value = data.resultData[field.fieldName];
            if (field.fieldType === 'number' && field.normalMin !== null && field.normalMax !== null) {
                const numValue = parseFloat(value);
                if (!isNaN(numValue) && (numValue < field.normalMin || numValue > field.normalMax)) {
                    abnormalValues.push({
                        field: field.fieldLabel,
                        value: numValue,
                        normalRange: `${field.normalMin} - ${field.normalMax} ${field.unit || ''}`,
                    });
                }
            }
        }

        // Auto-mark as critical if severely abnormal
        const autoMarkCritical = abnormalValues.some(av => {
            const field = order.test.resultFields.find(f => f.fieldLabel === av.field);
            if (field && field.normalMin !== null && field.normalMax !== null) {
                const val = av.value as number;
                const range = field.normalMax - field.normalMin;
                // Mark critical if value is >50% outside normal range
                return val < field.normalMin - range * 0.5 || val > field.normalMax + range * 0.5;
            }
            return false;
        });

        const isCritical = data.isCritical || autoMarkCritical;

        // Update order with result
        const updatedOrder = await prisma.labTestOrder.update({
            where: { id: data.orderId },
            data: {
                status: 'completed',
                resultData: data.resultData as Prisma.JsonObject,
                resultedAt: new Date(),
                resultedBy: data.resultedBy,
                isCritical,
            },
            include: {
                test: true,
                patient: {
                    select: { uhid: true, name: true },
                },
            },
        });

        // Create safety alert if critical
        if (isCritical) {
            await prisma.safetyAlert.create({
                data: {
                    patientId: order.patient.id,
                    alertType: 'critical-lab',
                    severity: 'critical',
                    message: `Critical lab result for ${order.test.name}`,
                    context: {
                        orderId: order.id,
                        testName: order.test.name,
                        abnormalValues,
                    },
                },
            });
        }

        // Create audit event
        await prisma.auditEvent.create({
            data: {
                entityType: 'LabTestOrder',
                entityId: order.id,
                action: 'result_submitted',
                performedBy: data.resultedBy,
                newValues: {
                    resultData: data.resultData,
                    isCritical,
                } as Prisma.JsonObject,
            },
        });

        return NextResponse.json({
            data: updatedOrder,
            analysis: {
                abnormalValues,
                isCritical,
                autoMarkedCritical: autoMarkCritical,
            },
            message: isCritical
                ? 'Result submitted - CRITICAL VALUES DETECTED'
                : 'Result submitted successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error submitting result:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to submit result' }, { status: 500 });
    }
}

// GET /api/lab-technician/results - Get result details
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.labTestOrder.findUnique({
            where: { id: orderId },
            include: {
                test: {
                    include: {
                        resultFields: {
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
                patient: {
                    select: {
                        id: true,
                        uhid: true,
                        name: true,
                        gender: true,
                        dob: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({ data: order });
    } catch (error) {
        console.error('Error fetching result:', error);
        return NextResponse.json({ error: 'Failed to fetch result' }, { status: 500 });
    }
}
