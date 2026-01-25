"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// --- Types ---
export type InventoryStats = {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
  nearExpiryItems: number;
};

export type StockItem = {
  id: string;
  name: string;
  itemCode: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderLevel: number;
  status: "ACTIVE" | "LOW_STOCK" | "OUT_OF_STOCK";
  batches: {
    id: string;
    batchNumber: string;
    quantity: number;
    expiryDate: Date;
    createdAt: Date; // In Order Date
  }[];
  transactions: {
    id: string;
    transactionType: string;
    quantity: number;
    performedAt: Date;
    notes: string | null;
    batchNumber: string | null;
  }[];
};

// --- Queries ---

export async function getInventoryStats(): Promise<InventoryStats> {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const [totalItems, items] = await Promise.all([
    prisma.inventoryItem.count({ where: { isActive: true } }),
    prisma.inventoryItem.findMany({
      where: { isActive: true },
      include: {
        batches: {
          where: { quantity: { gt: 0 } },
        },
      },
    }),
  ]);

  let totalValue = 0;
  let lowStockItems = 0;
  let expiredItems = 0;
  let nearExpiryItems = 0;

  for (const item of items) {
    if (item.currentStock <= item.reorderLevel) {
      lowStockItems++;
    }

    for (const batch of item.batches) {
      totalValue += batch.quantity * (batch.costPrice || 0);

      if (batch.expiryDate < now) {
        expiredItems++;
      } else if (batch.expiryDate <= thirtyDaysFromNow) {
        nearExpiryItems++;
      }
    }
  }

  return {
    totalItems,
    totalValue,
    lowStockItems,
    expiredItems,
    nearExpiryItems,
  };
}

export async function getStockItems(): Promise<StockItem[]> {
  const items = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    include: {
      batches: {
        where: { quantity: { gt: 0 } },
        orderBy: { expiryDate: "asc" }, // FEFO ordering for display
      },
      transactions: {
        orderBy: { performedAt: "desc" },
        take: 20,
      },
    },
    orderBy: { name: "asc" },
  });

  return items.map((item) => {
    let status: StockItem["status"] = "ACTIVE";
    if (item.currentStock === 0) status = "OUT_OF_STOCK";
    else if (item.currentStock <= item.reorderLevel) status = "LOW_STOCK";

    return {
      id: item.id,
      name: item.name,
      itemCode: item.itemCode,
      category: item.category,
      currentStock: item.currentStock,
      unit: item.unit,
      reorderLevel: item.reorderLevel,
      status,
      batches: item.batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        quantity: b.quantity,
        expiryDate: b.expiryDate,
        createdAt: b.createdAt,
      })),
      transactions: item.transactions.map((t) => ({
        id: t.id,
        transactionType: t.transactionType,
        quantity: t.quantity,
        performedAt: t.performedAt,
        notes: t.notes,
        batchNumber: t.batchNumber, 
      })),
    };
  });
}

// --- Actions ---

export async function addStock(data: {
  itemId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: Date;
  costPrice: number;
  vendorId?: string;
}) {
  try {
    const { itemId, batchNumber, quantity, expiryDate, costPrice, vendorId } = data;

    // 1. Create Batch
    await prisma.inventoryBatch.create({
      data: {
        itemId,
        batchNumber,
        quantity,
        expiryDate,
        costPrice,
        vendorId,
      },
    });

    // 2. Update Item Stock
    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: {
        currentStock: { increment: quantity },
      },
    });

    // 3. Record Transaction
    await prisma.stockTransaction.create({
      data: {
        itemId,
        transactionType: "IN",
        quantity,
        batchNumber,
        performedBy: "SYSTEM", // TODO: Get actual user
        notes: "Stock added manually",
      },
    });

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error adding stock:", error);
    return { success: false, error: "Failed to add stock" };
  }
}

export async function issueStock(itemId: string, quantity: number, notes?: string) {
  try {
    // FEFO Logic: Fetch batches ordered by expiryDate ASC
    const batches = await prisma.inventoryBatch.findMany({
      where: {
        itemId,
        quantity: { gt: 0 },
      },
      orderBy: { expiryDate: "asc" },
    });

    const totalAvailable = batches.reduce((sum, b) => sum + b.quantity, 0);
    if (totalAvailable < quantity) {
      return { success: false, error: "Insufficient stock" };
    }

    let remainingQty = quantity;
    const updates = [];

    for (const batch of batches) {
      if (remainingQty <= 0) break;

      const take = Math.min(batch.quantity, remainingQty);
      
      // Update batch
      updates.push(
        prisma.inventoryBatch.update({
          where: { id: batch.id },
          data: { quantity: { decrement: take } },
        })
      );

      // Record transaction per batch interaction
      updates.push(
        prisma.stockTransaction.create({
          data: {
            itemId,
            transactionType: "OUT",
            quantity: take,
            batchNumber: batch.batchNumber,
            performedBy: "SYSTEM", // TODO: Get actual user
            notes: notes || "Stock issued (FEFO)",
          },
        })
      );

      remainingQty -= take;
    }

    // Update Item Total Stock
    updates.push(
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: { decrement: quantity } },
      })
    );

    await prisma.$transaction(updates);

    revalidatePath("/inventory");
    return { success: true };
  } catch (error) {
    console.error("Error issuing stock:", error);
    return { success: false, error: "Failed to issue stock" };
  }
}
