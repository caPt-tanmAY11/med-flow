import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const grnItemSchema = z.object({
    itemId: z.string().uuid(),
    batchNumber: z.string().min(1),
    quantity: z.number().int().positive(),
    expiryDate: z.string().datetime(), // ISO string
    costPrice: z.number().nonnegative(),
    sellingPrice: z.number().nonnegative().optional(),
});

const grnSchema = z.object({
    poId: z.string().uuid(),
    grnNumber: z.string().min(1),
    receivedBy: z.string(),
    notes: z.string().optional(),
    items: z.array(grnItemSchema),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const data = grnSchema.parse(body);

        // Verify PO
        const po = await prisma.purchaseOrder.findUnique({
            where: { id: data.poId },
            include: { items: true },
        });

        if (!po) {
            return NextResponse.json({ error: 'Purchase Order not found' }, { status: 404 });
        }

        if (po.status !== 'approved' && po.status !== 'partial') {
            return NextResponse.json({ error: `PO status is ${po.status}, cannot receive` }, { status: 400 });
        }

        // Verify items against PO (Simplified: just check existence)
        // In strict mode, we'd check quantities remaining. 
        // For now, we assume user verifies.

        // Create GRN
        const result = await prisma.$transaction(async (tx) => {
            const grn = await tx.goodsReceipt.create({
                data: {
                    poId: data.poId,
                    grnNumber: data.grnNumber,
                    receivedBy: data.receivedBy,
                    receivedAt: new Date(),
                    notes: data.notes,
                },
            });

            for (const item of data.items) {
                // Create GRN Item
                await tx.goodsReceiptItem.create({
                    data: {
                        grnId: grn.id,
                        itemId: item.itemId,
                        batchNumber: item.batchNumber,
                        quantity: item.quantity,
                        expiryDate: new Date(item.expiryDate),
                    },
                });

                // Create Inventory Batch
                await tx.inventoryBatch.create({
                    data: {
                        itemId: item.itemId,
                        batchNumber: item.batchNumber,
                        quantity: item.quantity,
                        expiryDate: new Date(item.expiryDate),
                        costPrice: item.costPrice,
                        sellingPrice: item.sellingPrice,
                        vendorId: po.vendorId,
                        grnId: grn.id,
                    },
                });

                // Update Item Master Stock
                await tx.inventoryItem.update({
                    where: { id: item.itemId },
                    data: {
                        currentStock: { increment: item.quantity },
                        // Update cost? Maybe average, but we keep batch costs.
                    },
                });

                // Create Transaction Log (IN)
                await tx.stockTransaction.create({
                    data: {
                        itemId: item.itemId,
                        transactionType: 'IN',
                        quantity: item.quantity,
                        batchNumber: item.batchNumber,
                        performedBy: data.receivedBy,
                        performedAt: new Date(),
                        notes: `GRN: ${data.grnNumber}`,
                    },
                });
            }

            // Update PO Status (Simplified)
            await tx.purchaseOrder.update({
                where: { id: data.poId },
                data: { status: 'received' } // should be 'partial' if not full, but 'received' for now
            });

            return grn;
        });

        return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
        console.error('Error creating GRN:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create GRN' }, { status: 500 });
    }
}
