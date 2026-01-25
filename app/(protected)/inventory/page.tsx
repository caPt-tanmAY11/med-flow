import { Suspense } from "react";
import { getInventoryStats, getStockItems } from "./actions";
import { InventoryStatsCards } from "./_components/InventoryStats";
import { StockList } from "./_components/StockList";
import { ExpiryAlerts } from "./_components/ExpiryAlerts";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stats = await getInventoryStats();
  const items = await getStockItems();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Inventory Management</h2>
      </div>
      
      <InventoryStatsCards stats={stats} />
      
      <ExpiryAlerts items={items} />

      <div className="space-y-4">
        <h3 className="text-xl font-semibold tracking-tight">Current Stock (FEFO Priority)</h3>
        <Suspense fallback={<div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
             <StockList items={items} />
        </Suspense>
      </div>
    </div>
  );
}
