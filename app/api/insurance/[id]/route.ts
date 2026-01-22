import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT /api/insurance/[id] - Update pre-auth or claim
export async function PUT(request: NextRequest, context: RouteParams) {
    try {
        const { id } = await context.params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const body = await request.json();

        if (type === 'preauth') {
            const preAuth = await prisma.preAuthorization.update({
                where: { id },
                data: {
                    status: body.status,
                    approvedAmount: body.approvedAmount,
                    respondedAt: new Date(),
                    remarks: body.remarks,
                },
            });
            return NextResponse.json({ data: preAuth });
        }

        if (type === 'claim') {
            const claim = await prisma.insuranceClaim.update({
                where: { id },
                data: {
                    status: body.status,
                    approvedAmount: body.approvedAmount,
                    settledAt: body.status === 'settled' ? new Date() : undefined,
                    rejectionReason: body.rejectionReason,
                },
            });
            return NextResponse.json({ data: claim });
        }

        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (error) {
        console.error('Error updating insurance:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
