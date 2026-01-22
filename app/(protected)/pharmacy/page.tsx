"use client";

import { useEffect, useState } from 'react';
import { Pill, RefreshCw, Loader2, CheckCircle, X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Prescription {
    id: string;
    status: string;
    prescribedAt: string;
    prescribedBy: string;
    patient: { uhid: string; name: string };
    encounter: { type: string; department: string | null };
    medications: { id: string; medicationName: string; dosage: string; frequency: string; route: string; duration: string; isDispensed: boolean }[];
}

export default function PharmacyPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [filter, setFilter] = useState('');
    const [selectedRx, setSelectedRx] = useState<Prescription | null>(null);
    const [dispensing, setDispensing] = useState<string | null>(null);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.append('status', filter);
            const response = await fetch(`/api/pharmacy?${params}`);
            const result = await response.json();
            setPrescriptions(result.data || []);
            setPendingCount(result.stats?.pendingDispense || 0);
        } catch (error) {
            console.error('Failed to fetch prescriptions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPrescriptions(); }, [filter]);

    const handleDispense = async (medicationId: string) => {
        setDispensing(medicationId);
        try {
            const response = await fetch('/api/pharmacy/dispense', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ medicationId, dispensedBy: 'Pharmacist' }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Medication dispensed' });
                fetchPrescriptions();
                // Refresh selected prescription
                if (selectedRx) {
                    const updated = prescriptions.find(p => p.id === selectedRx.id);
                    if (updated) {
                        const med = updated.medications.find(m => m.id === medicationId);
                        if (med) med.isDispensed = true;
                    }
                }
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to dispense', variant: 'destructive' });
        } finally {
            setDispensing(null);
        }
    };

    const handleDispenseAll = async (rx: Prescription) => {
        const pendingMeds = rx.medications.filter(m => !m.isDispensed);
        for (const med of pendingMeds) {
            await handleDispense(med.id);
        }
        toast({ title: 'Success', description: 'All medications dispensed' });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Pill className="w-6 h-6 text-primary" />Pharmacy</h1><p className="text-sm text-muted-foreground mt-1">{pendingCount} medications pending dispense</p></div>
                <Button variant="outline" size="sm" onClick={fetchPrescriptions}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className={cn("kpi-card cursor-pointer", !filter && "ring-2 ring-primary")} onClick={() => setFilter('')}><p className="text-xs text-muted-foreground">All</p><p className="text-xl font-bold">{prescriptions.length}</p></div>
                <div className={cn("kpi-card cursor-pointer border-l-4 border-l-status-warning", filter === 'active' && "ring-2 ring-primary")} onClick={() => setFilter('active')}><p className="text-xs text-muted-foreground">Active</p><p className="text-xl font-bold text-status-warning">{prescriptions.filter(p => p.status === 'active').length}</p></div>
                <div className={cn("kpi-card cursor-pointer border-l-4 border-l-status-success", filter === 'completed' && "ring-2 ring-primary")} onClick={() => setFilter('completed')}><p className="text-xs text-muted-foreground">Completed</p><p className="text-xl font-bold text-status-success">{prescriptions.filter(p => p.status === 'completed').length}</p></div>
            </div>

            <div className="space-y-4">
                {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : prescriptions.length === 0 ? <p className="text-center text-muted-foreground py-8">No prescriptions found</p> : (
                    prescriptions.map((rx) => {
                        const pendingMeds = rx.medications.filter(m => !m.isDispensed);
                        return (
                            <div key={rx.id} className="floating-card">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="font-medium">{rx.patient.name}</p>
                                        <p className="text-xs text-muted-foreground">{rx.patient.uhid} • {rx.encounter.type}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {pendingMeds.length > 0 && (
                                            <Button size="sm" onClick={() => handleDispenseAll(rx)}>Dispense All ({pendingMeds.length})</Button>
                                        )}
                                        <span className={cn("px-2 py-1 text-xs rounded capitalize", rx.status === 'active' ? 'bg-status-warning/10 text-status-warning' : 'bg-status-success/10 text-status-success')}>{rx.status}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {rx.medications.map((med) => (
                                        <div key={med.id} className={cn("flex items-center justify-between p-3 rounded-lg", med.isDispensed ? "bg-status-success/5" : "bg-muted/50")}>
                                            <div>
                                                <p className="font-medium text-sm">{med.medicationName}</p>
                                                <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency} • {med.route} • {med.duration}</p>
                                            </div>
                                            {med.isDispensed ? (
                                                <CheckCircle className="w-5 h-5 text-status-success" />
                                            ) : (
                                                <Button size="sm" onClick={() => handleDispense(med.id)} disabled={dispensing === med.id}>
                                                    {dispensing === med.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dispense'}
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
