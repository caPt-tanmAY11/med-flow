/**
 * Tariff Master API
 * 
 * GET: List all active tariffs with search/filter
 * POST: Create or update tariff (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');
        const tariffCode = searchParams.get('tariffCode');

        // Single tariff lookup
        if (tariffCode) {
            const tariff = await prisma.tariffMaster.findUnique({
                where: { tariffCode }
            });
            return NextResponse.json(tariff);
        }

        // Build filter
        const where: any = { isActive: true };
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { tariffCode: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const tariffs = await prisma.tariffMaster.findMany({
            where,
            orderBy: [{ category: 'asc' }, { description: 'asc' }]
        });

        // Group by category for UI
        const byCategory: Record<string, typeof tariffs> = {};
        for (const t of tariffs) {
            if (!byCategory[t.category]) byCategory[t.category] = [];
            byCategory[t.category].push(t);
        }

        return NextResponse.json({
            tariffs,
            byCategory,
            categories: Object.keys(byCategory)
        });

    } catch (error) {
        console.error('Tariff GET error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { tariffCode, category, description, basePrice, isActive } = body;

        if (!tariffCode || !category || !description || basePrice === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.tariffMaster.findUnique({
            where: { tariffCode }
        });

        if (existing) {
            // Update
            const updated = await prisma.tariffMaster.update({
                where: { tariffCode },
                data: { category, description, basePrice, isActive: isActive ?? true }
            });
            return NextResponse.json({ tariff: updated, action: 'updated' });
        } else {
            // Create
            const created = await prisma.tariffMaster.create({
                data: {
                    tariffCode,
                    category,
                    description,
                    basePrice,
                    effectiveFrom: new Date(),
                    isActive: isActive ?? true
                }
            });
            return NextResponse.json({ tariff: created, action: 'created' });
        }

    } catch (error) {
        console.error('Tariff POST error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
