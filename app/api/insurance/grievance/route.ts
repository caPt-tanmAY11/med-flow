
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const claimId = searchParams.get('claimId');

        if (!claimId) return NextResponse.json({ error: 'Missing claimId' }, { status: 400 });

        const grievances = await prisma.claimGrievance.findMany({
            where: { claimId },
            orderBy: { createdAt: 'asc' },
        });
        return NextResponse.json({ data: grievances });
    } catch (error) {
        console.error('Error fetching grievances:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const grievance = await prisma.claimGrievance.create({
            data: {
                claimId: body.claimId,
                senderId: body.senderId,
                senderRole: body.senderRole,
                message: body.message,
            },
        });
        return NextResponse.json({ data: grievance }, { status: 201 });
    } catch (error) {
        console.error('Error creating grievance:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
