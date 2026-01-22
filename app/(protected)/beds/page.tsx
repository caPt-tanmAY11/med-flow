"use client";

import { useEffect, useState } from 'react';
import { Bed as BedIcon, RefreshCw, Loader2, Search, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Bed {
    id: string;
    bedNumber: string;
    ward: string;
    type: string;
    status: string;
    floor: number | null;
    assignments: { encounter: { id: string; patient: { uhid: string; name: string; gender: string } } }[];
}

interface BedSummary { total: number; available: number; occupied: number; cleaning: number; occupancyRate?: number; }

export default function BedsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [beds, setBeds] = useState<Bed[]>([]);
    const [summary, setSummary] = useState<BedSummary>({ total: 0, available: 0, occupied: 0, cleaning: 0 });
    const [byWard, setByWard] = useState<Record<string, { beds: Bed[]; available: number; occupied: number }>>({});
    const [filter, setFilter] = useState({ ward: '', status: '' });
    const [search, setSearch] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBedModal, setShowBedModal] = useState(false);
    const [selectedBed, setSelectedBed] = useState<Bed | null>(null);
    const [newBed, setNewBed] = useState({ bedNumber: '', ward: '', type: 'general', floor: 1 });
    const [saving, setSaving] = useState(false);

    const fetchBeds = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.ward) params.append('ward', filter.ward);
            if (filter.status) params.append('status', filter.status);
            const response = await fetch(`/api/beds?${params}`);
            const result = await response.json();
            setBeds(result.data || []);
            setSummary(result.summary || { total: 0, available: 0, occupied: 0, cleaning: 0 });
            setByWard(result.byWard || {});
        } catch (error) {
            console.error('Failed to fetch beds:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBeds(); }, [filter.ward, filter.status]);

    const handleAddBed = async () => {
        if (!newBed.bedNumber || !newBed.ward) {
            toast({ title: 'Error', description: 'Bed number and ward are required', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/beds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newBed),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Bed added successfully' });
                setShowAddModal(false);
                setNewBed({ bedNumber: '', ward: '', type: 'general', floor: 1 });
                fetchBeds();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error || 'Failed to add bed', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add bed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleBedClick = (bed: Bed) => {
        setSelectedBed(bed);
        setShowBedModal(true);
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedBed) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/beds/${selectedBed.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Bed marked as ${newStatus}` });
                setShowBedModal(false);
                setSelectedBed(null);
                fetchBeds();
            } else {
                toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update bed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-status-success text-white';
            case 'OCCUPIED': return 'bg-status-critical text-white';
            case 'CLEANING': return 'bg-status-warning text-white';
            case 'MAINTENANCE': return 'bg-gray-500 text-white';
            case 'RESERVED': return 'bg-blue-500 text-white';
            default: return 'bg-gray-300';
        }
    };

    const wards = [...new Set(beds.map(b => b.ward))];

    if (loading) {
        return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><BedIcon className="w-6 h-6 text-primary" />Bed Management</h1>
                    <p className="text-sm text-muted-foreground mt-1">{summary.occupancyRate || 0}% occupancy • {summary.available} beds available</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchBeds}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                    <Button size="sm" onClick={() => setShowAddModal(true)}><Plus className="w-4 h-4 mr-2" />Add Bed</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="kpi-card border-l-4 border-l-primary"><p className="text-xs text-muted-foreground">Total Beds</p><p className="text-2xl font-bold">{summary.total}</p></div>
                <div className="kpi-card border-l-4 border-l-status-success"><p className="text-xs text-muted-foreground">Available</p><p className="text-2xl font-bold text-status-success">{summary.available}</p></div>
                <div className="kpi-card border-l-4 border-l-status-critical"><p className="text-xs text-muted-foreground">Occupied</p><p className="text-2xl font-bold text-status-critical">{summary.occupied}</p></div>
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">Cleaning</p><p className="text-2xl font-bold text-status-warning">{summary.cleaning}</p></div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search beds..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <select className="elegant-select" value={filter.ward} onChange={(e) => setFilter(f => ({ ...f, ward: e.target.value }))}>
                    <option value="">All Wards</option>
                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select className="elegant-select" value={filter.status} onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}>
                    <option value="">All Status</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="CLEANING">Cleaning</option>
                </select>
            </div>

            {Object.entries(byWard).map(([ward, data]) => (
                <div key={ward} className="floating-card">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{ward}</h3>
                        <span className="text-sm text-muted-foreground">{data.available} available / {data.beds.length} total</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                        {data.beds.filter(bed => bed.bedNumber.toLowerCase().includes(search.toLowerCase())).map((bed) => (
                            <div key={bed.id} onClick={() => handleBedClick(bed)} className={cn("p-2 rounded-lg cursor-pointer transition-all hover:scale-105 text-center", getStatusColor(bed.status))} title={`${bed.bedNumber} - ${bed.status}`}>
                                <p className="text-xs font-bold">{bed.bedNumber}</p>
                                {bed.assignments[0]?.encounter?.patient && <p className="text-[10px] truncate">{bed.assignments[0].encounter.patient.name.split(' ')[0]}</p>}
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            <div className="flex gap-4 justify-center text-sm">
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-status-success" /><span>Available</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-status-critical" /><span>Occupied</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-status-warning" /><span>Cleaning</span></div>
                <div className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-gray-500" /><span>Maintenance</span></div>
            </div>

            {/* Add Bed Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Add New Bed</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowAddModal(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="space-y-4">
                            <div><Label>Bed Number *</Label><Input placeholder="e.g. ICU-01" value={newBed.bedNumber} onChange={(e) => setNewBed(b => ({ ...b, bedNumber: e.target.value }))} /></div>
                            <div><Label>Ward *</Label><Input placeholder="e.g. ICU, General Ward A" value={newBed.ward} onChange={(e) => setNewBed(b => ({ ...b, ward: e.target.value }))} /></div>
                            <div><Label>Type</Label>
                                <select className="elegant-select" value={newBed.type} onChange={(e) => setNewBed(b => ({ ...b, type: e.target.value }))}>
                                    <option value="general">General</option>
                                    <option value="icu">ICU</option>
                                    <option value="private">Private</option>
                                    <option value="semi-private">Semi-Private</option>
                                    <option value="picu">PICU</option>
                                </select>
                            </div>
                            <div><Label>Floor</Label><Input type="number" value={newBed.floor} onChange={(e) => setNewBed(b => ({ ...b, floor: parseInt(e.target.value) || 1 }))} /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button onClick={handleAddBed} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Add Bed</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bed Status Modal */}
            {showBedModal && selectedBed && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Bed {selectedBed.bedNumber}</h2>
                            <Button variant="ghost" size="sm" onClick={() => { setShowBedModal(false); setSelectedBed(null); }}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between"><span className="text-muted-foreground">Ward</span><span>{selectedBed.ward}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{selectedBed.type}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Current Status</span><span className={cn("px-2 py-0.5 text-xs rounded", getStatusColor(selectedBed.status))}>{selectedBed.status}</span></div>
                            {selectedBed.assignments[0]?.encounter?.patient && (
                                <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{selectedBed.assignments[0].encounter.patient.name}</span></div>
                            )}
                        </div>
                        <div className="mt-6">
                            <Label className="text-sm mb-2 block">Change Status</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button variant="outline" size="sm" className="bg-status-success/10 border-status-success text-status-success" disabled={selectedBed.status === 'AVAILABLE' || selectedBed.status === 'OCCUPIED'} onClick={() => handleStatusChange('AVAILABLE')}>Available</Button>
                                <Button variant="outline" size="sm" className="bg-status-warning/10 border-status-warning text-status-warning" disabled={selectedBed.status === 'CLEANING'} onClick={() => handleStatusChange('CLEANING')}>Cleaning</Button>
                                <Button variant="outline" size="sm" className="bg-gray-500/10 border-gray-500 text-gray-600" disabled={selectedBed.status === 'MAINTENANCE'} onClick={() => handleStatusChange('MAINTENANCE')}>Maintenance</Button>
                                <Button variant="outline" size="sm" className="bg-blue-500/10 border-blue-500 text-blue-500" disabled={selectedBed.status === 'RESERVED'} onClick={() => handleStatusChange('RESERVED')}>Reserved</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
