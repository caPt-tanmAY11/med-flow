"use client";

import { useEffect, useState } from 'react';
import { Ambulance, AlertTriangle, Clock, Users, Plus, RefreshCw, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Encounter {
    id: string;
    type: string;
    status: string;
    triageColor: string | null;
    arrivalTime: string;
    currentLocation: string | null;
    medicoLegalFlag: boolean;
    patient: { id: string; uhid: string; name: string; gender: string };
    bedAssignments: { bed: { bedNumber: string; ward: string } }[];
}

export default function EmergencyPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [stats, setStats] = useState({ immediate: 0, urgent: 0, delayed: 0, minor: 0 });
    const [showNewModal, setShowNewModal] = useState(false);
    const [patients, setPatients] = useState<{ id: string; uhid: string; name: string }[]>([]);
    const [newCase, setNewCase] = useState({ patientId: '', triageColor: 'YELLOW', medicoLegalFlag: false, triageNotes: '' });
    const [saving, setSaving] = useState(false);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

    const fetchEmergency = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        try {
            const response = await fetch('/api/encounters?type=EMERGENCY&status=ACTIVE');
            const result = await response.json();
            if (result.data) {
                setEncounters(result.data);
                const newStats = { immediate: 0, urgent: 0, delayed: 0, minor: 0 };
                result.data.forEach((e: Encounter) => {
                    if (e.triageColor === 'RED') newStats.immediate++;
                    else if (e.triageColor === 'ORANGE') newStats.urgent++;
                    else if (e.triageColor === 'YELLOW') newStats.delayed++;
                    else newStats.minor++;
                });
                setStats(newStats);
            }
        } catch (error) {
            console.error('Failed to fetch emergency data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch('/api/patients?limit=100');
            const result = await response.json();
            setPatients(result.data || []);
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        }
    };

    useEffect(() => {
        fetchEmergency();
        fetchPatients();
        const interval = setInterval(() => fetchEmergency(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const handleNewEmergency = async () => {
        if (!newCase.patientId) {
            toast({ title: 'Error', description: 'Please select a patient', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/encounters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: newCase.patientId,
                    type: 'EMERGENCY',
                    triageColor: newCase.triageColor,
                    medicoLegalFlag: newCase.medicoLegalFlag,
                    triageNotes: newCase.triageNotes,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Emergency case registered' });
                setShowNewModal(false);
                setNewCase({ patientId: '', triageColor: 'YELLOW', medicoLegalFlag: false, triageNotes: '' });
                fetchEmergency();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error || 'Failed', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to register emergency', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateTriage = async (encounterId: string, triageColor: string) => {
        try {
            const response = await fetch(`/api/encounters/${encounterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ triageColor }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Triage updated' });
                setSelectedEncounter(null);
                fetchEmergency();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
        }
    };

    const handleDischarge = async (encounterId: string) => {
        try {
            const response = await fetch(`/api/encounters/${encounterId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DISCHARGED', dischargeTime: new Date().toISOString() }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Patient discharged' });
                setSelectedEncounter(null);
                fetchEmergency();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to discharge', variant: 'destructive' });
        }
    };

    const getTriageColorClass = (color: string | null) => {
        switch (color) {
            case 'RED': return 'bg-status-critical';
            case 'ORANGE': return 'bg-orange-500';
            case 'YELLOW': return 'bg-status-warning';
            case 'GREEN': return 'bg-status-success';
            default: return 'bg-gray-400';
        }
    };

    const getTriageLabel = (color: string | null) => {
        switch (color) { case 'RED': return 'Immediate'; case 'ORANGE': return 'Urgent'; case 'YELLOW': return 'Delayed'; case 'GREEN': return 'Minor'; default: return 'Untriaged'; }
    };

    const getWaitTime = (arrivalTime: string) => {
        const diff = Date.now() - new Date(arrivalTime).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m`;
        return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    };

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Ambulance className="w-6 h-6 text-status-critical" />Emergency Department</h1>
                    <p className="text-sm text-muted-foreground mt-1">Live emergency board - Auto-refreshes every 30 seconds</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchEmergency(true)} disabled={refreshing}><RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />Refresh</Button>
                    <Button size="sm" onClick={() => setShowNewModal(true)}><Plus className="w-4 h-4 mr-2" />New Emergency</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card border-l-4 border-l-status-critical flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-status-critical animate-pulse" /></div><div><p className="text-xs text-muted-foreground">Immediate (Red)</p><p className="text-lg font-bold text-status-critical">{stats.immediate}</p></div></div>
                <div className="kpi-card border-l-4 border-l-orange-500 flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center"><Clock className="w-5 h-5 text-orange-500" /></div><div><p className="text-xs text-muted-foreground">Urgent (Orange)</p><p className="text-lg font-bold text-orange-500">{stats.urgent}</p></div></div>
                <div className="kpi-card border-l-4 border-l-status-warning flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center"><Users className="w-5 h-5 text-status-warning" /></div><div><p className="text-xs text-muted-foreground">Delayed (Yellow)</p><p className="text-lg font-bold text-status-warning">{stats.delayed}</p></div></div>
                <div className="kpi-card border-l-4 border-l-status-success flex items-center gap-4"><div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center"><Users className="w-5 h-5 text-status-success" /></div><div><p className="text-xs text-muted-foreground">Minor (Green)</p><p className="text-lg font-bold text-status-success">{stats.minor}</p></div></div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Active Emergency Cases ({encounters.length})</h3>
                {encounters.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No active emergency cases</p>
                ) : (
                    <div className="space-y-3">
                        {encounters.sort((a, b) => { const order = { RED: 0, ORANGE: 1, YELLOW: 2, GREEN: 3 }; return (order[a.triageColor as keyof typeof order] ?? 4) - (order[b.triageColor as keyof typeof order] ?? 4); }).map((encounter) => (
                            <div key={encounter.id} onClick={() => setSelectedEncounter(encounter)} className={cn("flex items-center justify-between p-4 bg-muted/30 rounded-xl border-l-4 cursor-pointer hover:bg-muted/50 transition-colors", encounter.triageColor === 'RED' && "border-l-status-critical bg-status-critical/5", encounter.triageColor === 'ORANGE' && "border-l-orange-500 bg-orange-500/5", encounter.triageColor === 'YELLOW' && "border-l-status-warning", encounter.triageColor === 'GREEN' && "border-l-status-success", !encounter.triageColor && "border-l-gray-400")}>
                                <div className="flex items-center gap-4">
                                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white font-bold", getTriageColorClass(encounter.triageColor))}>{encounter.triageColor?.charAt(0) || '?'}</div>
                                    <div>
                                        <div className="flex items-center gap-2"><p className="font-medium">{encounter.patient.name}</p><span className="text-xs text-muted-foreground">{encounter.patient.uhid}</span>{encounter.medicoLegalFlag && <span className="px-1.5 py-0.5 text-xs bg-status-critical/10 text-status-critical rounded">MLC</span>}</div>
                                        <p className="text-xs text-muted-foreground">{getTriageLabel(encounter.triageColor)} • {encounter.bedAssignments[0]?.bed.bedNumber || encounter.currentLocation || 'Waiting Area'}</p>
                                    </div>
                                </div>
                                <div className="text-right"><p className="text-sm font-medium flex items-center gap-1"><Clock className="w-3 h-3" />{getWaitTime(encounter.arrivalTime)}</p><p className="text-xs text-muted-foreground capitalize">{encounter.status.toLowerCase()}</p></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Emergency Modal */}
            {showNewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">New Emergency Case</h2><Button variant="ghost" size="sm" onClick={() => setShowNewModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-4">
                            <div><Label>Patient *</Label><select className="elegant-select" value={newCase.patientId} onChange={(e) => setNewCase(c => ({ ...c, patientId: e.target.value }))}><option value="">Select patient</option>{patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.uhid})</option>)}</select></div>
                            <div><Label>Triage Color *</Label><div className="grid grid-cols-4 gap-2 mt-1">{['RED', 'ORANGE', 'YELLOW', 'GREEN'].map(color => (<button key={color} onClick={() => setNewCase(c => ({ ...c, triageColor: color }))} className={cn("p-2 rounded-lg border-2 text-xs font-bold transition-all", newCase.triageColor === color ? 'ring-2 ring-offset-2' : '', color === 'RED' ? 'bg-status-critical/20 border-status-critical text-status-critical' : '', color === 'ORANGE' ? 'bg-orange-500/20 border-orange-500 text-orange-600' : '', color === 'YELLOW' ? 'bg-status-warning/20 border-status-warning text-status-warning' : '', color === 'GREEN' ? 'bg-status-success/20 border-status-success text-status-success' : '')}>{color}</button>))}</div></div>
                            <div><Label>Triage Notes</Label><Input placeholder="Chief complaint, observations..." value={newCase.triageNotes} onChange={(e) => setNewCase(c => ({ ...c, triageNotes: e.target.value }))} /></div>
                            <div className="flex items-center gap-2"><input type="checkbox" id="mlc" checked={newCase.medicoLegalFlag} onChange={(e) => setNewCase(c => ({ ...c, medicoLegalFlag: e.target.checked }))} /><Label htmlFor="mlc" className="cursor-pointer">Medico-Legal Case (MLC)</Label></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button><Button onClick={handleNewEmergency} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Register</Button></div>
                    </div>
                </div>
            )}

            {/* Case Detail Modal */}
            {selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Case Details</h2><Button variant="ghost" size="sm" onClick={() => setSelectedEncounter(null)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span className="font-medium">{selectedEncounter.patient.name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">UHID</span><span>{selectedEncounter.patient.uhid}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Wait Time</span><span>{getWaitTime(selectedEncounter.arrivalTime)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>{selectedEncounter.bedAssignments[0]?.bed.bedNumber || 'Waiting Area'}</span></div>
                        </div>
                        <div className="mb-4"><Label className="text-sm mb-2 block">Change Triage</Label><div className="grid grid-cols-4 gap-2">{['RED', 'ORANGE', 'YELLOW', 'GREEN'].map(color => (<button key={color} onClick={() => handleUpdateTriage(selectedEncounter.id, color)} className={cn("p-2 rounded-lg border text-xs font-bold", color === 'RED' ? 'bg-status-critical/20 border-status-critical text-status-critical' : '', color === 'ORANGE' ? 'bg-orange-500/20 border-orange-500 text-orange-600' : '', color === 'YELLOW' ? 'bg-status-warning/20 border-status-warning text-status-warning' : '', color === 'GREEN' ? 'bg-status-success/20 border-status-success text-status-success' : '')}>{color}</button>))}</div></div>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setSelectedEncounter(null)}>Close</Button><Button variant="destructive" onClick={() => handleDischarge(selectedEncounter.id)}>Discharge</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
