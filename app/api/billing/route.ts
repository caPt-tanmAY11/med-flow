import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { billCreateSchema } from '@/lib/validations';
import { Prisma } from '@prisma/client';

// Helper to generate bill number
function generateBillNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BILL-${year}${month}-${random}`;
}

// GET /api/billing - List bills
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const patientId = searchParams.get('patientId');
        const status = searchParams.get('status');
        const encounterId = searchParams.get('encounterId');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        const where: Prisma.BillWhereInput = {};
        if (patientId) where.patientId = patientId;
        if (status) where.status = status;
        if (encounterId) where.encounterId = encounterId;

        const [bills, total] = await Promise.all([
            prisma.bill.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    items: true,
                    payments: true,
                    claims: true,
                    patient: {
                        select: { id: true, uhid: true, name: true },
                    },
                },
            }),
            prisma.bill.count({ where }),
        ]);

        // Revenue stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayRevenue = await prisma.payment.aggregate({
            where: { receivedAt: { gte: today } },
            _sum: { amount: true },
        });

        const pendingAmount = await prisma.bill.aggregate({
            where: { status: { in: ['pending', 'partial'] } },
            _sum: { balanceDue: true },
        });

        return NextResponse.json({
            data: bills,
            stats: {
                todayRevenue: todayRevenue._sum.amount || 0,
                pendingAmount: pendingAmount._sum.balanceDue || 0,
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching bills:', error);
        return NextResponse.json({ error: 'Failed to fetch bills' }, { status: 500 });
    }
}

// POST /api/billing - Create bill
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = billCreateSchema.parse(body);

        // Generate unique bill number
        let billNumber = generateBillNumber();
        let attempts = 0;
        while (attempts < 10) {
            const existing = await prisma.bill.findUnique({ where: { billNumber } });
            if (!existing) break;
            billNumber = generateBillNumber();
            attempts++;
        }

        // Calculate totals
        const items = data.items.map(item => ({
            ...item,
            totalPrice: item.quantity * item.unitPrice,
        }));
        const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

        const bill = await prisma.bill.create({
            data: {
                billNumber,
                patientId: data.patientId,
                encounterId: data.encounterId,
                subtotal,
                discountAmount: 0,
                taxAmount: 0,
                totalAmount: subtotal,
                paidAmount: 0,
                balanceDue: subtotal,
                items: {
                    create: items.map(item => ({
                        category: item.category,
                        itemCode: item.itemCode,
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Bill',
                entityId: bill.id,
                action: 'create',
                performedBy: 'system',
                newValues: bill as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: bill }, { status: 201 });
    } catch (error) {
        console.error('Error creating bill:', error);
        return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
    }
}
