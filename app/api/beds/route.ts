import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/beds - List beds with status
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const ward = searchParams.get('ward');
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const floor = searchParams.get('floor');

        const where: Prisma.BedWhereInput = {};

        if (ward) where.ward = { contains: ward, mode: 'insensitive' };
        if (type) where.type = type;
        if (status) where.status = status as 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'MAINTENANCE' | 'RESERVED';
        if (floor) where.floor = parseInt(floor);

        const beds = await prisma.bed.findMany({
            where,
            orderBy: [{ ward: 'asc' }, { bedNumber: 'asc' }],
            include: {
                assignments: {
                    where: { endTime: null },
                    include: {
                        encounter: {
                            include: {
                                patient: {
                                    select: {
                                        id: true,
                                        uhid: true,
                                        name: true,
                                        gender: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Calculate summary statistics
        const summary = {
            total: beds.length,
            available: beds.filter(b => b.status === 'AVAILABLE').length,
            occupied: beds.filter(b => b.status === 'OCCUPIED').length,
            cleaning: beds.filter(b => b.status === 'CLEANING').length,
            maintenance: beds.filter(b => b.status === 'MAINTENANCE').length,
            reserved: beds.filter(b => b.status === 'RESERVED').length,
            occupancyRate: beds.length > 0
                ? Math.round((beds.filter(b => b.status === 'OCCUPIED').length / beds.length) * 100)
                : 0,
        };

        // Group by ward
        const byWard = beds.reduce((acc, bed) => {
            if (!acc[bed.ward]) {
                acc[bed.ward] = { beds: [], available: 0, occupied: 0 };
            }
            acc[bed.ward].beds.push(bed);
            if (bed.status === 'AVAILABLE') acc[bed.ward].available++;
            if (bed.status === 'OCCUPIED') acc[bed.ward].occupied++;
            return acc;
        }, {} as Record<string, { beds: typeof beds; available: number; occupied: number }>);

        return NextResponse.json({
            data: beds,
            summary,
            byWard,
        });
    } catch (error) {
        console.error('Error fetching beds:', error);
        return NextResponse.json(
            { error: 'Failed to fetch beds' },
            { status: 500 }
        );
    }
}

// POST /api/beds - Create a new bed
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { bedNumber, ward, floor, type, features } = body;

        if (!bedNumber || !ward || !type) {
            return NextResponse.json(
                { error: 'bedNumber, ward, and type are required' },
                { status: 400 }
            );
        }

        // Check for duplicate bed number
        const existing = await prisma.bed.findUnique({
            where: { bedNumber },
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Bed number already exists' },
                { status: 409 }
            );
        }

        const bed = await prisma.bed.create({
            data: {
                bedNumber,
                ward,
                floor: floor ? parseInt(floor) : null,
                type,
                features: features || [],
                status: 'AVAILABLE',
            },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'Bed',
                entityId: bed.id,
                action: 'create',
                performedBy: 'system',
                newValues: bed as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: bed }, { status: 201 });
    } catch (error) {
        console.error('Error creating bed:', error);
        return NextResponse.json(
            { error: 'Failed to create bed' },
            { status: 500 }
        );
    }
}
