"use client";

import { Package, AlertTriangle, TrendingDown, Search, Filter } from 'lucide-react';
import { mockInventory } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function InventoryPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Package className="w-6 h-6 text-primary" />
                        Inventory Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Track stock levels and manage inventory
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search items..." className="pl-10 w-64" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-status-critical" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Low Stock</p>
                        <p className="text-lg font-bold text-status-critical">12</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Expiring Soon</p>
                        <p className="text-lg font-bold text-status-warning">8</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Total Items</p>
                        <p className="text-lg font-bold">2,450</p>
                    </div>
                </div>
            </div>

            <div className="floating-card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Item Name</th>
                            <th>Category</th>
                            <th>Stock</th>
                            <th>Expiry</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockInventory.map((item) => {
                            const isLowStock = item.currentStock < item.minStock;
                            return (
                                <tr key={item.id} className={cn(isLowStock && "bg-status-critical/5")}>
                                    <td className="font-mono text-xs">{item.sku}</td>
                                    <td className="font-medium">{item.name}</td>
                                    <td>
                                        <span className="pill-badge text-xs">{item.category}</span>
                                    </td>
                                    <td>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(isLowStock && "text-status-critical font-bold")}>
                                                {item.currentStock}
                                            </span>
                                            <span className="text-muted-foreground text-xs">/ {item.maxStock}</span>
                                        </div>
                                    </td>
                                    <td className="text-muted-foreground">{item.expiryDate}</td>
                                    <td>
                                        <span className={cn(
                                            "status-badge text-xs",
                                            isLowStock ? "bg-status-critical/10 text-status-critical" : "bg-status-success/10 text-status-success"
                                        )}>
                                            {isLowStock ? 'Low Stock' : 'In Stock'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
