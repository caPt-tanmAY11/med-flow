import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/inventory - List inventory items
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const lowStock = searchParams.get('lowStock') === 'true';
        const expiringSoon = searchParams.get('expiringSoon') === 'true';
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const where: Prisma.InventoryItemWhereInput = { isActive: true };
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { itemCode: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [items, total] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    batches: {
                        where: { quantity: { gt: 0 } },
                        orderBy: { expiryDate: 'asc' },
                    },
                },
            }),
            prisma.inventoryItem.count({ where }),
        ]);

        // Calculate stats
        const lowStockItems = items.filter(i => i.currentStock <= i.reorderLevel);

        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const expiringBatches = await prisma.inventoryBatch.findMany({
            where: {
                expiryDate: { lte: thirtyDaysFromNow },
                quantity: { gt: 0 },
            },
            include: { item: true },
        });

        return NextResponse.json({
            data: items,
            stats: {
                totalItems: total,
                lowStockCount: lowStockItems.length,
                expiringCount: expiringBatches.length,
            },
            alerts: {
                lowStock: lowStockItems.map(i => ({ id: i.id, name: i.name, current: i.currentStock, reorder: i.reorderLevel })),
                expiring: expiringBatches.map(b => ({
                    itemId: b.itemId,
                    itemName: b.item.name,
                    batch: b.batchNumber,
                    expiryDate: b.expiryDate,
                    quantity: b.quantity
                })),
            },
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching inventory:', error);
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
}

// POST /api/inventory - Create inventory item
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { itemType, itemCode, name, category, unit, reorderLevel, maxStock, location } = body;

        // Check for duplicate item code
        const existing = await prisma.inventoryItem.findUnique({ where: { itemCode } });
        if (existing) {
            return NextResponse.json({ error: 'Item code already exists' }, { status: 409 });
        }

        const item = await prisma.inventoryItem.create({
            data: {
                itemType,
                itemCode,
                name,
                category,
                unit,
                reorderLevel: parseInt(reorderLevel),
                maxStock: parseInt(maxStock),
                location,
                currentStock: 0,
            },
        });

        await prisma.auditEvent.create({
            data: {
                entityType: 'InventoryItem',
                entityId: item.id,
                action: 'create',
                performedBy: 'system',
                newValues: item as unknown as Prisma.JsonObject,
            },
        });

        return NextResponse.json({ data: item }, { status: 201 });
    } catch (error) {
        console.error('Error creating inventory item:', error);
        return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
}
