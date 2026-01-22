"use client";

import { useEffect, useState } from 'react';
import { FlaskConical, RefreshCw, Loader2, AlertTriangle, CheckCircle, Clock, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface LabOrder {
    id: string;
    orderCode: string;
    orderName: string;
    priority: string;
    status: string;
    orderedAt: string;
    patientId: string;
    encounterId: string;
    sample: { id: string; barcode: string; status: string } | null;
    labResult: { id: string; isCritical: boolean; verifiedAt: string | null; result: Record<string, unknown> } | null;
    encounter: { patient: { uhid: string; name: string } };
}

export default function LabPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState({ status: '', priority: '' });
    const [selectedOrder, setSelectedOrder] = useState<LabOrder | null>(null);
    const [showCollectModal, setShowCollectModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [barcode, setBarcode] = useState('');
    const [resultValue, setResultValue] = useState('');
    const [isCritical, setIsCritical] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.priority) params.append('priority', filter.priority);
            const response = await fetch(`/api/lab?${params}`);
            const result = await response.json();
            setOrders(result.data || []);
            setStats(result.stats?.byStatus || {});
        } catch (error) {
            console.error('Failed to fetch lab orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 60000);
        return () => clearInterval(interval);
    }, [filter.status, filter.priority]);

    const handleCollectSample = async () => {
        if (!selectedOrder || !barcode) {
            toast({ title: 'Error', description: 'Barcode is required', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/lab/samples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: selectedOrder.id, sampleType: 'blood', barcode, collectedBy: 'Lab Tech' }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Sample collected' });
                setShowCollectModal(false);
                setSelectedOrder(null);
                setBarcode('');
                fetchOrders();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to collect sample', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleEnterResult = async () => {
        if (!selectedOrder || !resultValue) {
            toast({ title: 'Error', description: 'Result value is required', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/lab', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: selectedOrder.id, result: { value: resultValue }, isCritical, resultedBy: 'Lab Tech' }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Result entered' });
                setShowResultModal(false);
                setSelectedOrder(null);
                setResultValue('');
                setIsCritical(false);
                fetchOrders();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to enter result', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const openCollect = (order: LabOrder) => { setSelectedOrder(order); setShowCollectModal(true); };
    const openResult = (order: LabOrder) => { setSelectedOrder(order); setShowResultModal(true); };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { ordered: 'bg-blue-100 text-blue-700', collected: 'bg-yellow-100 text-yellow-700', processing: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-500' };
        return styles[status] || 'bg-gray-100 text-gray-500';
    };

    const getPriorityBadge = (priority: string) => {
        if (priority === 'STAT') return 'bg-status-critical text-white animate-pulse';
        if (priority === 'URGENT') return 'bg-status-warning text-white';
        return 'bg-muted text-muted-foreground';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><FlaskConical className="w-6 h-6 text-primary" />Laboratory</h1><p className="text-sm text-muted-foreground mt-1">Manage lab orders, samples, and results</p></div>
                <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {['ordered', 'collected', 'processing', 'completed', 'cancelled'].map((status) => (
                    <div key={status} className={cn("kpi-card cursor-pointer transition-all", filter.status === status && "ring-2 ring-primary")} onClick={() => setFilter(f => ({ ...f, status: f.status === status ? '' : status }))}>
                        <p className="text-xs text-muted-foreground capitalize">{status}</p><p className="text-xl font-bold">{stats[status] || 0}</p>
                    </div>
                ))}
            </div>

            <div className="flex gap-4">
                <select className="elegant-select" value={filter.priority} onChange={(e) => setFilter(f => ({ ...f, priority: e.target.value }))}>
                    <option value="">All Priorities</option><option value="STAT">STAT</option><option value="URGENT">Urgent</option><option value="ROUTINE">Routine</option>
                </select>
            </div>

            <div className="floating-card overflow-hidden">
                {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : orders.length === 0 ? <p className="text-center text-muted-foreground py-8">No lab orders found</p> : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr><th className="text-left p-3 text-xs font-medium text-muted-foreground">Priority</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Test</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Patient</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Barcode</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Result</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {orders.map((order) => (
                                <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded font-medium", getPriorityBadge(order.priority))}>{order.priority}</span></td>
                                    <td className="p-3"><p className="font-medium text-sm">{order.orderName}</p><p className="text-xs text-muted-foreground">{order.orderCode}</p></td>
                                    <td className="p-3"><p className="text-sm">{order.encounter.patient.name}</p><p className="text-xs text-muted-foreground">{order.encounter.patient.uhid}</p></td>
                                    <td className="p-3 font-mono text-sm">{order.sample?.barcode || '-'}</td>
                                    <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(order.status))}>{order.status}</span></td>
                                    <td className="p-3">{order.labResult ? <div className="flex items-center gap-1">{order.labResult.isCritical && <AlertTriangle className="w-4 h-4 text-status-critical" />}{order.labResult.verifiedAt ? <CheckCircle className="w-4 h-4 text-status-success" /> : <Clock className="w-4 h-4 text-status-warning" />}</div> : '-'}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            {order.status === 'ordered' && <Button size="sm" variant="outline" onClick={() => openCollect(order)}>Collect</Button>}
                                            {(order.status === 'collected' || order.status === 'processing') && <Button size="sm" variant="outline" onClick={() => openResult(order)}>Enter Result</Button>}
                                            {order.labResult && <Button size="sm" variant="ghost" onClick={() => { setSelectedOrder(order); }}>View</Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Collect Sample Modal */}
            {showCollectModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Collect Sample</h2><Button variant="ghost" size="sm" onClick={() => { setShowCollectModal(false); setSelectedOrder(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4"><div className="flex justify-between"><span className="text-muted-foreground">Test</span><span>{selectedOrder.orderName}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{selectedOrder.encounter.patient.name}</span></div></div>
                        <div className="mb-4"><Label>Barcode *</Label><Input placeholder="Scan or enter barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} autoFocus /></div>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowCollectModal(false); setSelectedOrder(null); }}>Cancel</Button><Button onClick={handleCollectSample} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Collect</Button></div>
                    </div>
                </div>
            )}

            {/* Enter Result Modal */}
            {showResultModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Enter Result</h2><Button variant="ghost" size="sm" onClick={() => { setShowResultModal(false); setSelectedOrder(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4"><div className="flex justify-between"><span className="text-muted-foreground">Test</span><span>{selectedOrder.orderName}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{selectedOrder.encounter.patient.name}</span></div></div>
                        <div className="space-y-4">
                            <div><Label>Result Value *</Label><Input placeholder="Enter result" value={resultValue} onChange={(e) => setResultValue(e.target.value)} /></div>
                            <div className="flex items-center gap-2"><input type="checkbox" id="critical" checked={isCritical} onChange={(e) => setIsCritical(e.target.checked)} /><Label htmlFor="critical" className="text-status-critical cursor-pointer">Mark as Critical</Label></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => { setShowResultModal(false); setSelectedOrder(null); }}>Cancel</Button><Button onClick={handleEnterResult} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Result</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
