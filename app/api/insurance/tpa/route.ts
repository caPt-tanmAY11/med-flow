
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const tpas = await prisma.tPA.findMany({
            orderBy: { name: 'asc' },
        });
        return NextResponse.json({ data: tpas });
    } catch (error) {
        console.error('Error fetching TPAs:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const tpa = await prisma.tPA.create({
            data: {
                name: body.name,
                code: body.code,
                contact: body.contact,
                email: body.email,
                website: body.website,
            },
        });
        return NextResponse.json({ data: tpa }, { status: 201 });
    } catch (error) {
        console.error('Error creating TPA:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
