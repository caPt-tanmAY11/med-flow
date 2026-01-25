import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/doctors - Fetch all users with DOCTOR role
export async function GET() {
    try {
        const doctors = await prisma.user.findMany({
            where: {
                role: 'DOCTOR',
            },
            select: {
                id: true,
                name: true,
                email: true,
                department: true,
            },
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json({
            data: doctors,
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json(
            { error: 'Failed to fetch doctors' },
            { status: 500 }
        );
    }
}
