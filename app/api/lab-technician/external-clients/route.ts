import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/lab-technician/external-clients - List all external lab clients
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const includeReferrals = searchParams.get('includeReferrals') === 'true';

        const clients = await prisma.externalLabClient.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
            include: includeReferrals ? {
                referrals: {
                    orderBy: { receivedAt: 'desc' },
                    take: 10,
                },
            } : undefined,
        });

        // Get referral stats
        const referralStats = await prisma.externalLabReferral.groupBy({
            by: ['status'],
            _count: { id: true },
        });

        return NextResponse.json({
            data: clients,
            stats: {
                totalClients: clients.length,
                referralsByStatus: referralStats.reduce((acc, s) => ({ ...acc, [s.status]: s._count.id }), {}),
            },
        });
    } catch (error) {
        console.error('Error fetching external clients:', error);
        return NextResponse.json({ error: 'Failed to fetch external clients' }, { status: 500 });
    }
}

// POST /api/lab-technician/external-clients - Create external client
const clientSchema = z.object({
    name: z.string().min(1),
    code: z.string().min(1).max(10),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = clientSchema.parse(body);

        // Check for duplicate code
        const existing = await prisma.externalLabClient.findUnique({
            where: { code: data.code },
        });

        if (existing) {
            return NextResponse.json({ error: 'Client code already exists' }, { status: 400 });
        }

        const client = await prisma.externalLabClient.create({
            data,
        });

        return NextResponse.json({ data: client }, { status: 201 });
    } catch (error) {
        console.error('Error creating external client:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create external client' }, { status: 500 });
    }
}

// PATCH /api/lab-technician/external-clients - Update external client
const updateClientSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const data = updateClientSchema.parse(body);

        const { id, ...updateData } = data;

        const client = await prisma.externalLabClient.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json({ data: client });
    } catch (error) {
        console.error('Error updating external client:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update external client' }, { status: 500 });
    }
}
