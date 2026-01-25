import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/lab-technician/barcode - Generate unique barcode
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const order = await prisma.labTestOrder.findUnique({
            where: { id: orderId },
            include: {
                test: true,
                patient: {
                    select: { uhid: true },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (order.barcode) {
            return NextResponse.json({
                data: { barcode: order.barcode },
                message: 'Barcode already exists for this order',
            });
        }

        // Generate unique barcode
        // Format: {LAB_CODE}-{PATIENT_UHID}-{TEST_CODE}-{YYMMDD}-{SEQ}
        const date = new Date();
        const dateStr = date.toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD

        // Get sequence number for today
        const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

        const todayCount = await prisma.labTestOrder.count({
            where: {
                barcode: { not: null },
                updatedAt: {
                    gte: todayStart,
                    lt: todayEnd,
                },
            },
        });

        const seq = String(todayCount + 1).padStart(4, '0');
        const labCode = order.test.type === 'RADIOLOGY' ? 'RAD' : 'LAB';
        const barcode = `${labCode}-${order.patient.uhid.replace('UHID-', '')}-${order.test.code}-${dateStr}-${seq}`;

        // Update order with barcode
        const updatedOrder = await prisma.labTestOrder.update({
            where: { id: orderId },
            data: {
                barcode,
                status: order.status === 'pending' ? 'sample_collected' : order.status,
            },
            include: {
                test: true,
                patient: {
                    select: { uhid: true, name: true },
                },
            },
        });

        return NextResponse.json({
            data: {
                barcode,
                order: updatedOrder,
            },
            message: 'Barcode generated successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error generating barcode:', error);
        return NextResponse.json({ error: 'Failed to generate barcode' }, { status: 500 });
    }
}

// GET /api/lab-technician/barcode - Lookup by barcode
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const barcode = searchParams.get('barcode');

        if (!barcode) {
            return NextResponse.json({ error: 'Barcode is required' }, { status: 400 });
        }

        const order = await prisma.labTestOrder.findUnique({
            where: { barcode },
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
                        allergies: {
                            where: { isActive: true },
                        },
                        implants: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: 'Order not found for this barcode' }, { status: 404 });
        }

        return NextResponse.json({ data: order });
    } catch (error) {
        console.error('Error looking up barcode:', error);
        return NextResponse.json({ error: 'Failed to lookup barcode' }, { status: 500 });
    }
}
