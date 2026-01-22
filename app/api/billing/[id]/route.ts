import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

interface RouteParams {
    params: Promise<{ id: string }>;
}

const paymentSchema = z.object({
    amount: z.number().positive(),
    paymentMode: z.enum(['cash', 'card', 'upi', 'cheque', 'neft', 'insurance']),
    referenceNumber: z.string().optional(),
    receivedBy: z.string(),
});

const discountSchema = z.object({
    discountType: z.enum(['percentage', 'fixed', 'scheme']),
    discountValue: z.number().positive(),
    reason: z.string().optional(),
    approvedBy: z.string().optional(),
});

// GET /api/billing/[id]
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;

        const bill = await prisma.bill.findUnique({
            where: { id },
            include: {
                items: true,
                payments: { orderBy: { receivedAt: 'desc' } },
                discounts: true,
                claims: true,
                patient: true,
                encounter: {
                    include: {
                        diagnoses: true,
                        procedures: true,
                    },
                },
            },
        });

        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        return NextResponse.json({ data: bill });
    } catch (error) {
        console.error('Error fetching bill:', error);
        return NextResponse.json({ error: 'Failed to fetch bill' }, { status: 500 });
    }
}

// POST /api/billing/[id]/payment - Add payment
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const action = searchParams.get('action');

        const bill = await prisma.bill.findUnique({ where: { id } });
        if (!bill) {
            return NextResponse.json({ error: 'Bill not found' }, { status: 404 });
        }

        const body = await request.json();

        if (action === 'payment') {
            const data = paymentSchema.parse(body);

            if (data.amount > bill.balanceDue) {
                return NextResponse.json({ error: 'Payment exceeds balance due' }, { status: 400 });
            }

            const payment = await prisma.payment.create({
                data: {
                    billId: id,
                    amount: data.amount,
                    paymentMode: data.paymentMode,
                    referenceNumber: data.referenceNumber,
                    receivedBy: data.receivedBy,
                },
            });

            const newPaidAmount = bill.paidAmount + data.amount;
            const newBalanceDue = bill.totalAmount - newPaidAmount;
            const newStatus = newBalanceDue <= 0 ? 'paid' : 'partial';

            await prisma.bill.update({
                where: { id },
                data: {
                    paidAmount: newPaidAmount,
                    balanceDue: newBalanceDue,
                    status: newStatus,
                },
            });

            await prisma.auditEvent.create({
                data: {
                    entityType: 'Payment',
                    entityId: payment.id,
                    action: 'create',
                    performedBy: data.receivedBy,
                    newValues: payment as unknown as Prisma.JsonObject,
                },
            });

            return NextResponse.json({ data: payment });
        }

        if (action === 'discount') {
            const data = discountSchema.parse(body);

            const discountAmount = data.discountType === 'percentage'
                ? (bill.subtotal * data.discountValue) / 100
                : data.discountValue;

            const discount = await prisma.billDiscount.create({
                data: {
                    billId: id,
                    discountType: data.discountType,
                    discountValue: data.discountValue,
                    reason: data.reason,
                    approvedBy: data.approvedBy,
                    status: data.approvedBy ? 'approved' : 'pending',
                    approvedAt: data.approvedBy ? new Date() : null,
                },
            });

            if (data.approvedBy) {
                const newTotal = bill.totalAmount - discountAmount;
                await prisma.bill.update({
                    where: { id },
                    data: {
                        discountAmount: bill.discountAmount + discountAmount,
                        totalAmount: newTotal,
                        balanceDue: newTotal - bill.paidAmount,
                    },
                });
            }

            return NextResponse.json({ data: discount });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error processing bill action:', error);
        return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
    }
}

// PUT /api/billing/[id] - Finalize bill
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { action, finalizedBy } = body;

        if (action === 'finalize') {
            const bill = await prisma.bill.update({
                where: { id },
                data: {
                    status: 'pending',
                    finalizedAt: new Date(),
                    finalizedBy,
                },
            });

            await prisma.auditEvent.create({
                data: {
                    entityType: 'Bill',
                    entityId: id,
                    action: 'finalize',
                    performedBy: finalizedBy,
                },
            });

            return NextResponse.json({ data: bill });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error finalizing bill:', error);
        return NextResponse.json({ error: 'Failed to finalize' }, { status: 500 });
    }
}
