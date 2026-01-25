import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/insurance - Get insurance data
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        if (type === 'preauth') {
            const preAuths = await prisma.preAuthorization.findMany({
                orderBy: { requestedAt: 'desc' },
                take: 100,
                include: {
                    policy: { select: { insurerName: true, policyNumber: true } },
                },
            });
            return NextResponse.json({ data: preAuths });
        }

        if (type === 'claims') {
            const claims = await prisma.insuranceClaim.findMany({
                orderBy: { submittedAt: 'desc' },
                take: 100,
                include: {
                    bill: { select: { billNumber: true, totalAmount: true } },
                    policy: { select: { insurerName: true, policyNumber: true } },
                    tpa: { select: { name: true } },
                },
            });
            return NextResponse.json({ data: claims });
        }

        if (type === 'policies') {
            const policies = await prisma.insurancePolicy.findMany({
                where: { isActive: true },
                orderBy: { createdAt: 'desc' },
                take: 100,
                include: {
                    patient: { select: { uhid: true, name: true } },
                },
            });
            return NextResponse.json({ data: policies });
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    } catch (error) {
        console.error('Error fetching insurance:', error);
        return NextResponse.json({ error: 'Failed to fetch insurance data' }, { status: 500 });
    }
}

// POST /api/insurance - Create pre-auth or claim
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, ...data } = body;

        if (type === 'preauth') {
            const preAuth = await prisma.preAuthorization.create({
                data: {
                    encounterId: data.encounterId,
                    policyId: data.policyId,
                    requestedAmount: data.requestedAmount,
                    documents: data.documents || [],
                },
            });
            return NextResponse.json({ data: preAuth }, { status: 201 });
        }

        if (type === 'claim') {
            const claim = await prisma.insuranceClaim.create({
                data: {
                    billId: data.billId,
                    policyId: data.policyId,
                    claimAmount: data.claimAmount,
                    tpaId: data.tpaId, // [NEW] Link TPA
                    documents: data.documents || [],
                },
            });
            return NextResponse.json({ data: claim }, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Error creating insurance record:', error);
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
