import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/doctor/medications - Get medications from inventory for prescription autocomplete
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q') || '';

        // Get medications from inventory
        const medications = await prisma.medication.findMany({
            where: {
                isActive: true,
                ...(query ? {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { genericName: { contains: query, mode: 'insensitive' } },
                    ],
                } : {}),
            },
            orderBy: { name: 'asc' },
            take: 50,
            select: {
                id: true,
                name: true,
                genericName: true,
                category: true,
                form: true,
                strength: true,
            },
        });

        // Also get items from inventory that are medicines
        const inventoryMeds = await prisma.inventoryItem.findMany({
            where: {
                isActive: true,
                category: { in: ['medicine', 'medication', 'drug', 'pharmaceutical'] },
                ...(query ? {
                    name: { contains: query, mode: 'insensitive' },
                } : {}),
            },
            orderBy: { name: 'asc' },
            take: 50,
            select: {
                id: true,
                name: true,
                category: true,
                currentStock: true,
            },
        });

        return NextResponse.json({
            medications,
            inventoryMeds,
        });
    } catch (error) {
        console.error('Error fetching medications:', error);
        return NextResponse.json({ error: 'Failed to fetch medications' }, { status: 500 });
    }
}
