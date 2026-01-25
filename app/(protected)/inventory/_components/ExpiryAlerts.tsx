"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Clock } from "lucide-react";
import { StockItem } from "../actions";
import { differenceInDays, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function ExpiryAlerts({ items }: { items: StockItem[] }) {
  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(now.getDate() + 30);

  const expiredBatches = items.flatMap(item => 
    item.batches
      .filter(b => isPast(b.expiryDate))
      .map(b => ({ ...b, itemName: item.name, itemCode: item.itemCode }))
  );

  const nearExpiryBatches = items.flatMap(item => 
    item.batches
      .filter(b => !isPast(b.expiryDate) && b.expiryDate <= thirtyDaysFromNow)
      .map(b => ({ ...b, itemName: item.name, itemCode: item.itemCode }))
  );

  if (expiredBatches.length === 0 && nearExpiryBatches.length === 0) return null;

  return (
    <div className="space-y-4">
      {expiredBatches.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Expired Stock Found</AlertTitle>
          <AlertDescription>
            The following batches have expired and should be disposed of:
            <ul className="mt-2 list-disc list-inside text-sm">
              {expiredBatches.map(b => (
                <li key={b.id}>
                  <span className="font-semibold">{b.itemName}</span> (Batch: {b.batchNumber}) - Expired {differenceInDays(now, b.expiryDate)} days ago ({b.quantity} units)
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {nearExpiryBatches.length > 0 && (
        <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10">
          <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertTitle className="text-yellow-800 dark:text-yellow-400">Expiring Soon (FEFO Recommended)</AlertTitle>
          <AlertDescription className="text-yellow-700 dark:text-yellow-300">
            The following batches are expiring within 30 days. Prioritize their usage:
            <ul className="mt-2 list-disc list-inside text-sm">
              {nearExpiryBatches.map(b => (
                 <li key={b.id}>
                  <span className="font-semibold">{b.itemName}</span> (Batch: {b.batchNumber}) - Expires in {differenceInDays(b.expiryDate, now)} days ({b.quantity} units)
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
