import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const sampleCollectionSchema = z.object({
    orderId: z.string().uuid(),
    sampleType: z.string(),
    collectedBy: z.string(),
    barcode: z.string(),
});

// POST /api/lab/samples - Collect sample
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = sampleCollectionSchema.parse(body);

        const order = await prisma.order.findUnique({ where: { id: data.orderId } });
        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Check for duplicate barcode
        const existingBarcode = await prisma.sample.findUnique({
            where: { barcode: data.barcode },
        });
        if (existingBarcode) {
            return NextResponse.json({ error: 'Barcode already exists' }, { status: 409 });
        }

        const sample = await prisma.sample.create({
            data: {
                orderId: data.orderId,
                sampleType: data.sampleType,
                collectedBy: data.collectedBy,
                barcode: data.barcode,
                status: 'collected',
            },
        });

        // Update order status
        await prisma.order.update({
            where: { id: data.orderId },
            data: { status: 'collected' },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Sample',
                entityId: sample.id,
                action: 'collect',
                performedBy: data.collectedBy,
                newValues: sample as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: sample }, { status: 201 });
    } catch (error) {
        console.error('Error collecting sample:', error);
        return NextResponse.json({ error: 'Failed to collect sample' }, { status: 500 });
    }
}

// GET /api/lab/samples - List samples
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const barcode = searchParams.get('barcode');

        const where: Prisma.SampleWhereInput = {};
        if (status) where.status = status;
        if (barcode) where.barcode = { contains: barcode };

        const samples = await prisma.sample.findMany({
            where,
            orderBy: { collectedAt: 'desc' },
            take: 100,
            include: {
                order: {
                    include: {
                        encounter: {
                            include: {
                                patient: { select: { uhid: true, name: true } },
                            },
                        },
                    },
                },
            },
        });

        return NextResponse.json({ data: samples });
    } catch (error) {
        console.error('Error fetching samples:', error);
        return NextResponse.json({ error: 'Failed to fetch samples' }, { status: 500 });
    }
}
