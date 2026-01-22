"use client";

import { useEffect, useState } from 'react';
import { Package, Search, RefreshCw, Loader2, AlertTriangle, TrendingDown, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
    id: string;
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    reorderLevel: number;
    maxStock: number;
}

interface InventoryAlerts {
    lowStock: { id: string; name: string; current: number; reorder: number }[];
    expiring: { itemName: string; batch: string; expiryDate: string; quantity: number }[];
}

export default function InventoryPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState({ totalItems: 0, lowStockCount: 0, expiringCount: 0 });
    const [alerts, setAlerts] = useState<InventoryAlerts>({ lowStock: [], expiring: [] });
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [newItem, setNewItem] = useState({ itemCode: '', name: '', category: 'medicine', unit: 'tablet', reorderLevel: 10, maxStock: 100, currentStock: 0 });
    const [stockAdjust, setStockAdjust] = useState({ quantity: 0, type: 'add', reason: '' });
    const [saving, setSaving] = useState(false);

    const fetchInventory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (category) params.append('category', category);
            const response = await fetch(`/api/inventory?${params}`);
            const result = await response.json();
            setItems(result.data || []);
            setStats(result.stats || { totalItems: 0, lowStockCount: 0, expiringCount: 0 });
            setAlerts(result.alerts || { lowStock: [], expiring: [] });
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchInventory(); }, [category]);
    useEffect(() => { const t = setTimeout(() => fetchInventory(), 300); return () => clearTimeout(t); }, [search]);

    const handleAddItem = async () => {
        if (!newItem.itemCode || !newItem.name) {
            toast({ title: 'Error', description: 'Item code and name are required', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newItem, itemType: newItem.category }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Item added' });
                setShowAddModal(false);
                setNewItem({ itemCode: '', name: '', category: 'medicine', unit: 'tablet', reorderLevel: 10, maxStock: 100, currentStock: 0 });
                fetchInventory();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add item', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleStockAdjust = async () => {
        if (!selectedItem || stockAdjust.quantity <= 0) {
            toast({ title: 'Error', description: 'Enter a valid quantity', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`/api/inventory/${selectedItem.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'adjust', quantity: stockAdjust.quantity, type: stockAdjust.type, reason: stockAdjust.reason, adjustedBy: 'Staff' }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Stock adjusted' });
                setShowStockModal(false);
                setSelectedItem(null);
                setStockAdjust({ quantity: 0, type: 'add', reason: '' });
                fetchInventory();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to adjust stock', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const openStockModal = (item: InventoryItem) => { setSelectedItem(item); setShowStockModal(true); };

    const getStockStatus = (item: InventoryItem) => {
        if (item.currentStock <= item.reorderLevel) return { color: 'text-status-critical', bg: 'bg-status-critical/10', label: 'Low' };
        if (item.currentStock <= item.reorderLevel * 1.5) return { color: 'text-status-warning', bg: 'bg-status-warning/10', label: 'Warning' };
        return { color: 'text-status-success', bg: 'bg-status-success/10', label: 'OK' };
    };

    const categories = [...new Set(items.map(i => i.category))];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Package className="w-6 h-6 text-primary" />Inventory</h1><p className="text-sm text-muted-foreground mt-1">Manage stock and supplies</p></div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchInventory}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                    <Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="kpi-card"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-2xl font-bold">{stats.totalItems}</p></div>
                <div className="kpi-card border-l-4 border-l-status-critical"><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-2xl font-bold text-status-critical">{stats.lowStockCount}</p></div>
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">Expiring Soon</p><p className="text-2xl font-bold text-status-warning">{stats.expiringCount}</p></div>
            </div>

            {(alerts.lowStock.length > 0 || alerts.expiring.length > 0) && (
                <div className="grid md:grid-cols-2 gap-4">
                    {alerts.lowStock.length > 0 && (<div className="floating-card border-l-4 border-l-status-critical"><h3 className="font-medium text-sm flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-status-critical" />Low Stock Alert</h3><ul className="space-y-1 text-sm">{alerts.lowStock.slice(0, 5).map((item) => (<li key={item.id} className="flex justify-between cursor-pointer hover:bg-muted/50 p-1 rounded" onClick={() => openStockModal(items.find(i => i.id === item.id)!)}><span>{item.name}</span><span className="text-status-critical font-medium">{item.current}/{item.reorder}</span></li>))}</ul></div>)}
                    {alerts.expiring.length > 0 && (<div className="floating-card border-l-4 border-l-status-warning"><h3 className="font-medium text-sm flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-status-warning" />Expiring Soon</h3><ul className="space-y-1 text-sm">{alerts.expiring.slice(0, 5).map((item, idx) => (<li key={idx} className="flex justify-between"><span>{item.itemName} ({item.batch})</span><span className="text-status-warning">{new Date(item.expiryDate).toLocaleDateString()}</span></li>))}</ul></div>)}
                </div>
            )}

            <div className="flex gap-4">
                <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" /></div>
                <select className="elegant-select" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All Categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select>
            </div>

            <div className="floating-card overflow-hidden">
                {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : items.length === 0 ? <p className="text-center text-muted-foreground py-8">No items found</p> : (
                    <table className="w-full">
                        <thead className="bg-muted/50"><tr><th className="text-left p-3 text-xs font-medium text-muted-foreground">Code</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Category</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Stock</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Reorder</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th></tr></thead>
                        <tbody className="divide-y">
                            {items.map((item) => {
                                const status = getStockStatus(item); return (
                                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono text-sm">{item.itemCode}</td>
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3 text-sm capitalize">{item.category}</td>
                                        <td className="p-3 text-right font-medium">{item.currentStock} {item.unit}</td>
                                        <td className="p-3 text-right text-muted-foreground">{item.reorderLevel}</td>
                                        <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded", status.bg, status.color)}>{status.label}</span></td>
                                        <td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => openStockModal(item)}>Adjust Stock</Button></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Item Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Add New Item</h2><Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-4">
                            <div><Label>Item Code *</Label><Input placeholder="e.g. MED-001" value={newItem.itemCode} onChange={(e) => setNewItem(i => ({ ...i, itemCode: e.target.value }))} /></div>
                            <div><Label>Name *</Label><Input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem(i => ({ ...i, name: e.target.value }))} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><Label>Category</Label><select className="elegant-select" value={newItem.category} onChange={(e) => setNewItem(i => ({ ...i, category: e.target.value }))}><option value="medicine">Medicine</option><option value="consumable">Consumable</option><option value="equipment">Equipment</option></select></div>
                                <div><Label>Unit</Label><select className="elegant-select" value={newItem.unit} onChange={(e) => setNewItem(i => ({ ...i, unit: e.target.value }))}><option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="vial">Vial</option><option value="box">Box</option><option value="piece">Piece</option></select></div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div><Label>Current Stock</Label><Input type="number" value={newItem.currentStock} onChange={(e) => setNewItem(i => ({ ...i, currentStock: parseInt(e.target.value) || 0 }))} /></div>
                                <div><Label>Reorder Level</Label><Input type="number" value={newItem.reorderLevel} onChange={(e) => setNewItem(i => ({ ...i, reorderLevel: parseInt(e.target.value) || 0 }))} /></div>
                                <div><Label>Max Stock</Label><Input type="number" value={newItem.maxStock} onChange={(e) => setNewItem(i => ({ ...i, maxStock: parseInt(e.target.value) || 0 }))} /></div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAddItem} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Item</Button></div>
                    </div>
                </div>
            )}

            {/* Adjust Stock Modal */}
            {showStockModal && selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Adjust Stock</h2><Button variant="ghost" size="sm" onClick={() => { setShowStockModal(false); setSelectedItem(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4"><div className="flex justify-between"><span className="text-muted-foreground">Item</span><span className="font-medium">{selectedItem.name}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Current Stock</span><span>{selectedItem.currentStock} {selectedItem.unit}</span></div></div>
                        <div className="space-y-4">
                            <div><Label>Adjustment Type</Label><div className="grid grid-cols-2 gap-2 mt-1"><button onClick={() => setStockAdjust(s => ({ ...s, type: 'add' }))} className={cn("p-2 rounded border text-sm", stockAdjust.type === 'add' ? 'bg-status-success/10 border-status-success text-status-success' : 'border-muted')}>Add Stock</button><button onClick={() => setStockAdjust(s => ({ ...s, type: 'remove' }))} className={cn("p-2 rounded border text-sm", stockAdjust.type === 'remove' ? 'bg-status-critical/10 border-status-critical text-status-critical' : 'border-muted')}>Remove Stock</button></div></div>
                            <div><Label>Quantity</Label><Input type="number" value={stockAdjust.quantity} onChange={(e) => setStockAdjust(s => ({ ...s, quantity: parseInt(e.target.value) || 0 }))} /></div>
                            <div><Label>Reason</Label><Input placeholder="e.g. Purchase, Damaged, Expired" value={stockAdjust.reason} onChange={(e) => setStockAdjust(s => ({ ...s, reason: e.target.value }))} /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => { setShowStockModal(false); setSelectedItem(null); }}>Cancel</Button><Button onClick={handleStockAdjust} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Adjust</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
