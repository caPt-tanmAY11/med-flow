import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/lab-tests - Fetch available tests with filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const type = searchParams.get('type'); // LAB or RADIOLOGY
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        // Build where clause
        const where: {
            isActive: boolean;
            category?: string;
            type?: string;
            OR?: Array<{ name: { contains: string; mode: 'insensitive' } } | { code: { contains: string; mode: 'insensitive' } } | { description: { contains: string; mode: 'insensitive' } }>;
        } = {
            isActive: true,
        };

        if (category) where.category = category;
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [tests, total, categories] = await Promise.all([
            prisma.labTest.findMany({
                where,
                orderBy: [{ category: 'asc' }, { name: 'asc' }],
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    LabTestResultField: {
                        orderBy: { sortOrder: 'asc' },
                    },
                },
            }),
            prisma.labTest.count({ where }),
            prisma.labTest.groupBy({
                by: ['category'],
                where: { isActive: true },
                _count: { id: true },
            }),
        ]);

        // Group tests by category for better UI display
        const groupedByCategory = tests.reduce((acc, test) => {
            if (!acc[test.category]) {
                acc[test.category] = [];
            }
            acc[test.category].push(test);
            return acc;
        }, {} as Record<string, typeof tests>);

        return NextResponse.json({
            data: tests,
            grouped: groupedByCategory,
            categories: categories.map(c => ({ name: c.category, count: c._count.id })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching lab tests:', error);
        return NextResponse.json({ error: 'Failed to fetch lab tests' }, { status: 500 });
    }
}

// POST /api/lab-tests - Add test to cart
const addToCartSchema = z.object({
    patientId: z.string().uuid(),
    testId: z.string().uuid(),
    scheduledDate: z.string().datetime().optional(),
    notes: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = addToCartSchema.parse(body);

        // Check if test exists and is active
        const test = await prisma.labTest.findUnique({
            where: { id: data.testId },
        });

        if (!test || !test.isActive) {
            return NextResponse.json({ error: 'Test not found or not available' }, { status: 404 });
        }

        // Check if already in cart
        const existing = await prisma.labTestOrder.findFirst({
            where: {
                patientId: data.patientId,
                testId: data.testId,
                status: 'cart',
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Test already in cart' }, { status: 400 });
        }

        // Add to cart
        const order = await prisma.labTestOrder.create({
            data: {
                patientId: data.patientId,
                testId: data.testId,
                status: 'cart',
                scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
                notes: data.notes ?? null,
            },
            include: {
                LabTest: true,
            },
        });

        return NextResponse.json({ data: order }, { status: 201 });
    } catch (error) {
        console.error('Error adding to cart:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
    }
}
