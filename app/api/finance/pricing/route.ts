import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/finance/pricing - Get all active tariffs/pricing
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        const where: { isActive: boolean; category?: string } = { isActive: true };
        if (category) {
            where.category = category.toLowerCase();
        }

        const tariffs = await prisma.tariffMaster.findMany({
            where,
            orderBy: [{ category: 'asc' }, { basePrice: 'asc' }],
        });

        // Group tariffs by category for easier consumption
        const grouped = tariffs.reduce((acc : any, tariff : any) => {
            const cat = tariff.category.toUpperCase();
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push({
                id: tariff.id,
                code: tariff.tariffCode,
                description: tariff.description,
                price: tariff.basePrice,
            });
            return acc;
        }, {} as Record<string, { id: string; code: string; description: string; price: number }[]>);

        return NextResponse.json({
            data: tariffs,
            grouped,
            categories: Object.keys(grouped),
        });
    } catch (error) {
        console.error('Error fetching pricing:', error);
        return NextResponse.json({ error: 'Failed to fetch pricing' }, { status: 500 });
    }
}

// POST /api/finance/pricing - Create or update tariff (admin only)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tariffCode, category, description, basePrice } = body;

        if (!tariffCode || !category || !description || basePrice === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const tariff = await prisma.tariffMaster.upsert({
            where: { tariffCode },
            update: { category, description, basePrice },
            create: {
                tariffCode,
                category: category.toLowerCase(),
                description,
                basePrice,
                effectiveFrom: new Date(),
            },
        });

        return NextResponse.json({ data: tariff }, { status: 201 });
    } catch (error) {
        console.error('Error creating/updating tariff:', error);
        return NextResponse.json({ error: 'Failed to save tariff' }, { status: 500 });
    }
}
