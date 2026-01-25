import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// GET /api/lab-technician/inventory - List all inventory items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const lowStock = searchParams.get('lowStock') === 'true';

        const where: {
            isActive: boolean;
            category?: string;
            currentStock?: { lt: number };
        } = {
            isActive: true,
        };

        if (category) where.category = category;

        const items = await prisma.labInventoryItem.findMany({
            where,
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
        });

        // Filter low stock items
        const filteredItems = lowStock
            ? items.filter(item => item.currentStock < item.minStock)
            : items;

        // Calculate stats
        const lowStockItems = items.filter(item => item.currentStock < item.minStock);
        const expiringSoon = items.filter(item => {
            if (!item.expiryDate) return false;
            const daysUntilExpiry = (item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
            return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
        });

        // Group by category
        const byCategory = items.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = { count: 0, totalValue: 0 };
            }
            acc[item.category].count++;
            acc[item.category].totalValue += (item.unitCost || 0) * item.currentStock;
            return acc;
        }, {} as Record<string, { count: number; totalValue: number }>);

        return NextResponse.json({
            data: filteredItems,
            stats: {
                totalItems: items.length,
                lowStockCount: lowStockItems.length,
                expiringSoonCount: expiringSoon.length,
                byCategory,
            },
            alerts: {
                lowStock: lowStockItems.map(i => ({ id: i.id, name: i.name, current: i.currentStock, min: i.minStock })),
                expiringSoon: expiringSoon.map(i => ({ id: i.id, name: i.name, expiryDate: i.expiryDate })),
            },
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

// POST /api/lab-technician/inventory - Create inventory item
const createSchema = z.object({
    itemCode: z.string().min(1),
    name: z.string().min(1),
    category: z.enum(['reagents', 'consumables', 'equipment']),
    unit: z.string().min(1),
    currentStock: z.number().int().min(0).default(0),
    minStock: z.number().int().min(0).default(10),
    maxStock: z.number().int().min(0).optional(),
    unitCost: z.number().min(0).optional(),
    expiryDate: z.string().datetime().optional(),
    location: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = createSchema.parse(body);

        // Check for duplicate item code
        const existing = await prisma.labInventoryItem.findUnique({
            where: { itemCode: data.itemCode },
        });

        if (existing) {
            return NextResponse.json({ error: 'Item code already exists' }, { status: 400 });
        }

        const item = await prisma.labInventoryItem.create({
            data: {
                id: crypto.randomUUID(),
                ...data,
                expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
            },
        });

        return NextResponse.json({ data: item }, { status: 201 });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
    }
}

// PATCH /api/lab-technician/inventory - Update inventory item
const updateSchema = z.object({
    id: z.string().uuid(),
    currentStock: z.number().int().min(0).optional(),
    minStock: z.number().int().min(0).optional(),
    maxStock: z.number().int().min(0).optional(),
    unitCost: z.number().min(0).optional(),
    expiryDate: z.string().datetime().optional(),
    location: z.string().optional(),
    isActive: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const data = updateSchema.parse(body);

        const { id, ...updateData } = data;

        const item = await prisma.labInventoryItem.update({
            where: { id },
            data: {
                ...updateData,
                expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : undefined,
            },
        });

        return NextResponse.json({ data: item });
    } catch (error) {
        console.error('Error updating inventory item:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid request data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to update inventory item' }, { status: 500 });
    }
}
