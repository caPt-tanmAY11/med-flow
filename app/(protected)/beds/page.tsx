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
            case 'AVAILABLE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'OCCUPIED': return 'bg-rose-100 text-rose-700 border-rose-200';
            case 'CLEANING': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'MAINTENANCE': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'RESERVED': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const wards = [...new Set(beds.map(b => b.ward))];

    if (loading) {
        return <div className="flex items-center justify-center h-[calc(100vh-100px)]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <BedIcon className="w-8 h-8" />
                        </div>
                        Bed Management
                    </h1>
                    <p className="text-muted-foreground mt-2 text-lg">
                        Real-time tracking of hospital bed occupancy and status
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={fetchBeds} className="h-10">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                    <Button onClick={() => setShowAddModal(true)} className="h-10 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Add New Bed
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Capacity', value: summary.total, color: 'text-foreground', bg: 'bg-background', border: 'border-border' },
                    { label: 'Available Beds', value: summary.available, color: 'text-emerald-600', bg: 'bg-emerald-50/50', border: 'border-emerald-100' },
                    { label: 'Occupied', value: summary.occupied, color: 'text-rose-600', bg: 'bg-rose-50/50', border: 'border-rose-100' },
                    { label: 'Cleaning/Maint.', value: summary.cleaning, color: 'text-amber-600', bg: 'bg-amber-50/50', border: 'border-amber-100' },
                ].map((stat, i) => (
                    <div key={i} className={cn("p-6 rounded-2xl border transition-all duration-200 hover:shadow-md", stat.bg, stat.border)}>
                        <p className="text-sm font-medium text-muted-foreground mb-2">{stat.label}</p>
                        <p className={cn("text-3xl font-bold tracking-tight", stat.color)}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="p-4 bg-muted/30 rounded-xl border border-border/50 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search bed number or patient..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="pl-10 h-10 bg-background border-border" 
                    />
                </div>
                <select 
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={filter.ward} 
                    onChange={(e) => setFilter(f => ({ ...f, ward: e.target.value }))}
                >
                    <option value="">All Wards</option>
                    {wards.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select 
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    value={filter.status} 
                    onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                >
                    <option value="">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="CLEANING">Cleaning</option>
                </select>
            </div>

            {/* Bed Grid by Ward */}
            <div className="space-y-8">
                {Object.entries(byWard).map(([ward, data]) => {
                    const filteredBeds = data.beds.filter(bed => 
                        bed.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
                        (bed.assignments[0]?.encounter?.patient?.name.toLowerCase().includes(search.toLowerCase()))
                    );

                    if (filteredBeds.length === 0) return null;

                    return (
                        <div key={ward} className="space-y-4">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                                    {ward}
                                </h3>
                                <span className="text-sm px-3 py-1 rounded-full bg-secondary text-secondary-foreground font-medium">
                                    {data.available} available
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
                                {filteredBeds.map((bed) => (
                                    <button 
                                        key={bed.id} 
                                        onClick={() => handleBedClick(bed)} 
                                        className={cn(
                                            "group p-3 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 flex flex-col items-center justify-center min-h-[90px] relative overflow-hidden",
                                            getStatusColor(bed.status),
                                            "bg-opacity-50 hover:bg-opacity-100"
                                        )}
                                    >
                                        <span className="text-sm font-bold tracking-tight">{bed.bedNumber}</span>
                                        {bed.assignments[0]?.encounter?.patient ? (
                                            <span className="text-[10px] mt-1 font-medium opacity-90 truncate w-full text-center px-1">
                                                {bed.assignments[0].encounter.patient.name.split(' ')[0]}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] mt-1 opacity-70 font-medium">{bed.status.toLowerCase()}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Bed Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Plus className="w-5 h-5 text-primary" /> Add New Bed
                            </h2>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setShowAddModal(false)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div className="space-y-2">
                                <Label>Bed Number <span className="text-rose-500">*</span></Label>
                                <Input 
                                    placeholder="e.g. A-101" 
                                    value={newBed.bedNumber} 
                                    onChange={(e) => setNewBed(b => ({ ...b, bedNumber: e.target.value }))}
                                    className="focus-visible:ring-primary"
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Ward Type <span className="text-rose-500">*</span></Label>
                                <select 
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-primary"
                                    value={newBed.ward} 
                                    onChange={(e) => setNewBed(b => ({ ...b, ward: e.target.value }))}
                                >
                                    <option value="" disabled>Select Ward Type</option>
                                    <option value="Emergency">Emergency</option>
                                    <option value="ICU">ICU</option>
                                    <option value="General ward A">General ward A</option>
                                    <option value="General ward B">General ward B</option>
                                    <option value="Private Room (Single occupancy)">Private Room (Single occupancy)</option>
                                    <option value="Private Room (Double occupancy)">Private Room (Double occupancy)</option>
                                    <option value="Private Room (Triple occupancy)">Private Room (Triple occupancy)</option>
                                </select>
                            </div>



                            <div className="space-y-2">
                                <Label>Floor Location</Label>
                                <select 
                                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-primary"
                                    value={newBed.floor} 
                                    onChange={(e) => setNewBed(b => ({ ...b, floor: parseInt(e.target.value) }))}
                                >
                                    <option value="0">Ground Floor</option>
                                    <option value="1">1st Floor</option>
                                    <option value="2">2nd Floor</option>
                                    <option value="3">3rd Floor</option>
                                    <option value="4">4th Floor</option>
                                    <option value="5">5th Floor</option>
                                    <option value="6">6th Floor</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-muted/20 border-t border-border flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            <Button onClick={handleAddBed} disabled={saving} className="bg-primary hover:bg-primary/90">
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Add Bed
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bed Status Modal */}
            {showBedModal && selectedBed && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                    <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-0 overflow-hidden border border-border">
                        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
                            <div>
                                <h2 className="text-lg font-bold">Bed {selectedBed.bedNumber}</h2>
                                <p className="text-xs text-muted-foreground">{selectedBed.ward}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => { setShowBedModal(false); setSelectedBed(null); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            {/* Current Status Badge */}
                            <div className="flex justify-center">
                                <div className={cn("px-4 py-1.5 rounded-full text-sm font-semibold border", getStatusColor(selectedBed.status))}>
                                    {selectedBed.status}
                                </div>
                            </div>

                            {/* Patient Info */}
                            {selectedBed.assignments[0]?.encounter?.patient && (
                                <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Occupant Details</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Name:</span>
                                            <span className="font-medium">{selectedBed.assignments[0].encounter.patient.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">UHID:</span>
                                            <span className="font-medium">{selectedBed.assignments[0].encounter.patient.uhid}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Gender:</span>
                                            <span className="font-medium capitalize">{selectedBed.assignments[0].encounter.patient.gender.toLowerCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="space-y-3">
                                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Quick Actions</Label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Available Button - Always show unless already available */}
                                    <Button 
                                        variant="outline" 
                                        className="h-auto py-3 flex flex-col gap-1 items-center bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800"
                                        disabled={selectedBed.status === 'AVAILABLE' || selectedBed.status === 'OCCUPIED'}
                                        onClick={() => handleStatusChange('AVAILABLE')}
                                    >
                                        <span className="font-semibold">Mark Available</span>
                                        <span className="text-[10px] opacity-80">Ready for patient</span>
                                    </Button>

                                    {/* Cleaning - Only if AVAILABLE */}
                                    {(selectedBed.status === 'AVAILABLE' || selectedBed.status === 'CLEANING') && (
                                        <Button 
                                            variant="outline" 
                                            className="h-auto py-3 flex flex-col gap-1 items-center bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800"
                                            disabled={selectedBed.status === 'CLEANING'}
                                            onClick={() => handleStatusChange('CLEANING')}
                                        >
                                            <span className="font-semibold">Cleaning</span>
                                            <span className="text-[10px] opacity-80">Mark for cleaning</span>
                                        </Button>
                                    )}

                                    {/* Maintenance - Only if AVAILABLE */}
                                    {(selectedBed.status === 'AVAILABLE' || selectedBed.status === 'MAINTENANCE') && (
                                        <Button 
                                            variant="outline" 
                                            className="h-auto py-3 flex flex-col gap-1 items-center bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                                            disabled={selectedBed.status === 'MAINTENANCE'}
                                            onClick={() => handleStatusChange('MAINTENANCE')}
                                        >
                                            <span className="font-semibold">Maintenance</span>
                                            <span className="text-[10px] opacity-80">Out of order</span>
                                        </Button>
                                    )}
                                </div>
                                    {selectedBed.status === 'OCCUPIED' && (
                                        <Button 
                                            variant="outline" 
                                            className="h-auto py-3 flex flex-col gap-1 items-center bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:text-rose-800 col-span-2"
                                            onClick={() => handleStatusChange('AVAILABLE')}
                                        >
                                            <span className="font-semibold">Discharge Patient</span>
                                            <span className="text-[10px] opacity-80">Clear patient and mark available</span>
                                        </Button>
                                    )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
