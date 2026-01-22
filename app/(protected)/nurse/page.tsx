"use client";

import { useEffect, useState } from 'react';
import { Heart, Activity, ThermometerSun, Plus, X, Loader2, RefreshCw, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Patient {
    id: string;
    uhid: string;
    name: string;
    gender: string;
    allergies: { allergen: string; severity: string }[];
}

interface Encounter {
    id: string;
    type: string;
    status: string;
    patient: Patient;
    currentLocation: string | null;
    bedAssignments: { bed: { bedNumber: string; ward: string } }[];
}

interface VitalSign {
    id: string;
    recordedAt: string;
    temperature: number | null;
    pulse: number | null;
    respRate: number | null;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    spO2: number | null;
}

interface MARItem {
    id: string;
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    isDispensed: boolean;
    administrations: { administeredAt: string; status: string }[];
}

export default function NursePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showMARModal, setShowMARModal] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [vitals, setVitals] = useState({ temperature: '', pulse: '', respRate: '', bpSystolic: '', bpDiastolic: '', spO2: '', painScore: '', notes: '' });
    const [recentVitals, setRecentVitals] = useState<VitalSign[]>([]);
    const [marItems, setMARItems] = useState<MARItem[]>([]);
    const [handover, setHandover] = useState({ patientSummary: '', pendingTasks: '', alerts: '' });
    const [saving, setSaving] = useState(false);

    const fetchEncounters = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/encounters?status=ACTIVE&type=IPD');
            const result = await response.json();
            setEncounters(result.data || []);
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEncounters(); }, []);

    const fetchVitals = async (encounterId: string) => {
        try {
            const response = await fetch(`/api/vitals?encounterId=${encounterId}&limit=5`);
            const result = await response.json();
            setRecentVitals(result.data || []);
        } catch (error) {
            console.error('Failed to fetch vitals:', error);
        }
    };

    const fetchMAR = async (encounterId: string) => {
        try {
            const response = await fetch(`/api/nursing?encounterId=${encounterId}`);
            const result = await response.json();
            setMARItems(result.data || []);
        } catch (error) {
            console.error('Failed to fetch MAR:', error);
        }
    };

    const openVitals = (encounter: Encounter) => {
        setSelectedEncounter(encounter);
        setShowVitalsModal(true);
        fetchVitals(encounter.id);
    };

    const openMAR = (encounter: Encounter) => {
        setSelectedEncounter(encounter);
        setShowMARModal(true);
        fetchMAR(encounter.id);
    };

    const openHandover = (encounter: Encounter) => {
        setSelectedEncounter(encounter);
        setShowHandoverModal(true);
    };

    const handleRecordVitals = async () => {
        if (!selectedEncounter) return;
        setSaving(true);
        try {
            const response = await fetch('/api/vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedEncounter.id,
                    patientId: selectedEncounter.patient.id,
                    recordedBy: 'Nurse',
                    temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
                    pulse: vitals.pulse ? parseInt(vitals.pulse) : null,
                    respRate: vitals.respRate ? parseInt(vitals.respRate) : null,
                    bpSystolic: vitals.bpSystolic ? parseInt(vitals.bpSystolic) : null,
                    bpDiastolic: vitals.bpDiastolic ? parseInt(vitals.bpDiastolic) : null,
                    spO2: vitals.spO2 ? parseFloat(vitals.spO2) : null,
                    painScore: vitals.painScore ? parseInt(vitals.painScore) : null,
                    notes: vitals.notes || null,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Vitals recorded' });
                setVitals({ temperature: '', pulse: '', respRate: '', bpSystolic: '', bpDiastolic: '', spO2: '', painScore: '', notes: '' });
                fetchVitals(selectedEncounter.id);
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to record vitals', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleAdminister = async (medicationId: string, status: string) => {
        if (!selectedEncounter) return;
        try {
            const response = await fetch('/api/nursing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'administer',
                    prescriptionMedicationId: medicationId,
                    encounterId: selectedEncounter.id,
                    administeredBy: 'Nurse',
                    dose: '1',
                    route: 'oral',
                    status,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Medication ${status}` });
                fetchMAR(selectedEncounter.id);
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed', variant: 'destructive' });
        }
    };

    const handleHandover = async () => {
        if (!selectedEncounter) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'handover',
                    encounterId: selectedEncounter.id,
                    outgoingNurse: 'Current Nurse',
                    incomingNurse: 'Next Nurse',
                    patientSummary: handover.patientSummary,
                    pendingTasks: handover.pendingTasks.split('\n').filter(t => t.trim()),
                    alerts: handover.alerts.split('\n').filter(a => a.trim()),
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Handover documented' });
                setShowHandoverModal(false);
                setHandover({ patientSummary: '', pendingTasks: '', alerts: '' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const isAbnormal = (type: string, value: number | null): boolean => {
        if (!value) return false;
        switch (type) {
            case 'temp': return value < 36 || value > 38;
            case 'pulse': return value < 60 || value > 100;
            case 'resp': return value < 12 || value > 20;
            case 'spo2': return value < 95;
            case 'bp': return value < 90 || value > 140;
            default: return false;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Heart className="w-6 h-6 text-status-critical" />Nurse Station</h1>
                    <p className="text-sm text-muted-foreground mt-1">{encounters.length} admitted patients</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchEncounters}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : encounters.length === 0 ? (
                <div className="floating-card text-center py-12"><p className="text-muted-foreground">No admitted patients</p></div>
            ) : (
                <div className="grid gap-4">
                    {encounters.map((encounter) => (
                        <div key={encounter.id} className="floating-card">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-status-critical/10 flex items-center justify-center text-status-critical font-bold text-lg">{encounter.patient.name.charAt(0)}</div>
                                    <div>
                                        <div className="flex items-center gap-2"><p className="font-medium">{encounter.patient.name}</p><span className="text-xs text-muted-foreground">{encounter.patient.uhid}</span></div>
                                        <p className="text-sm text-muted-foreground">Bed: {encounter.bedAssignments[0]?.bed.bedNumber || 'Not assigned'} • {encounter.bedAssignments[0]?.bed.ward || ''}</p>
                                        {encounter.patient.allergies?.length > 0 && (<div className="flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3 text-status-critical" /><span className="text-xs text-status-critical">Allergies</span></div>)}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openVitals(encounter)}><ThermometerSun className="w-4 h-4 mr-1" />Vitals</Button>
                                    <Button size="sm" variant="outline" onClick={() => openMAR(encounter)}><Activity className="w-4 h-4 mr-1" />MAR</Button>
                                    <Button size="sm" onClick={() => openHandover(encounter)}><Clock className="w-4 h-4 mr-1" />Handover</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Vitals Modal */}
            {showVitalsModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Record Vitals</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowVitalsModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="grid grid-cols-4 gap-3 mb-6">
                            <div><Label>Temp (°C)</Label><Input type="number" step="0.1" placeholder="36.5" value={vitals.temperature} onChange={(e) => setVitals(v => ({ ...v, temperature: e.target.value }))} className={isAbnormal('temp', parseFloat(vitals.temperature)) ? 'border-status-critical' : ''} /></div>
                            <div><Label>Pulse</Label><Input type="number" placeholder="72" value={vitals.pulse} onChange={(e) => setVitals(v => ({ ...v, pulse: e.target.value }))} className={isAbnormal('pulse', parseInt(vitals.pulse)) ? 'border-status-critical' : ''} /></div>
                            <div><Label>Resp Rate</Label><Input type="number" placeholder="16" value={vitals.respRate} onChange={(e) => setVitals(v => ({ ...v, respRate: e.target.value }))} className={isAbnormal('resp', parseInt(vitals.respRate)) ? 'border-status-critical' : ''} /></div>
                            <div><Label>SpO2 (%)</Label><Input type="number" step="0.1" placeholder="98" value={vitals.spO2} onChange={(e) => setVitals(v => ({ ...v, spO2: e.target.value }))} className={isAbnormal('spo2', parseFloat(vitals.spO2)) ? 'border-status-critical' : ''} /></div>
                            <div><Label>BP Systolic</Label><Input type="number" placeholder="120" value={vitals.bpSystolic} onChange={(e) => setVitals(v => ({ ...v, bpSystolic: e.target.value }))} className={isAbnormal('bp', parseInt(vitals.bpSystolic)) ? 'border-status-critical' : ''} /></div>
                            <div><Label>BP Diastolic</Label><Input type="number" placeholder="80" value={vitals.bpDiastolic} onChange={(e) => setVitals(v => ({ ...v, bpDiastolic: e.target.value }))} /></div>
                            <div><Label>Pain (0-10)</Label><Input type="number" min="0" max="10" placeholder="0" value={vitals.painScore} onChange={(e) => setVitals(v => ({ ...v, painScore: e.target.value }))} /></div>
                            <div><Label>Notes</Label><Input placeholder="Optional" value={vitals.notes} onChange={(e) => setVitals(v => ({ ...v, notes: e.target.value }))} /></div>
                        </div>
                        <Button className="w-full mb-6" onClick={handleRecordVitals} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Record Vitals</Button>
                        {recentVitals.length > 0 && (<div><h3 className="font-medium mb-2">Recent Readings</h3><div className="space-y-2">{recentVitals.map((v) => (<div key={v.id} className="p-3 bg-muted/30 rounded-lg flex justify-between text-sm"><span>{new Date(v.recordedAt).toLocaleTimeString()}</span><span>T: {v.temperature || '-'}°C</span><span>P: {v.pulse || '-'}</span><span>R: {v.respRate || '-'}</span><span>BP: {v.bpSystolic || '-'}/{v.bpDiastolic || '-'}</span><span>SpO2: {v.spO2 || '-'}%</span></div>))}</div></div>)}
                    </div>
                </div>
            )}

            {/* MAR Modal */}
            {showMARModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Medication Administration Record</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowMARModal(false)}><X className="w-4 h-4" /></Button></div>
                        {marItems.length === 0 ? (<p className="text-center text-muted-foreground py-8">No medications prescribed</p>) : (
                            <div className="space-y-3">{marItems.map((med) => (<div key={med.id} className="p-4 bg-muted/30 rounded-lg"><div className="flex items-start justify-between"><div><p className="font-medium">{med.medicationName}</p><p className="text-sm text-muted-foreground">{med.dosage} • {med.frequency} • {med.route}</p>{med.administrations.length > 0 && (<p className="text-xs text-muted-foreground mt-1">Last: {new Date(med.administrations[0].administeredAt).toLocaleString()}</p>)}</div><div className="flex gap-2">{med.isDispensed ? (<><Button size="sm" className="bg-status-success hover:bg-status-success/90" onClick={() => handleAdminister(med.id, 'given')}><CheckCircle className="w-4 h-4 mr-1" />Given</Button><Button size="sm" variant="outline" onClick={() => handleAdminister(med.id, 'held')}>Held</Button><Button size="sm" variant="outline" onClick={() => handleAdminister(med.id, 'refused')}>Refused</Button></>) : (<span className="text-xs text-status-warning">Not dispensed</span>)}</div></div></div>))}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Handover Modal */}
            {showHandoverModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Shift Handover</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowHandoverModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-4"><div><Label>Patient Summary</Label><textarea className="w-full p-3 border rounded-lg min-h-[80px] resize-none" placeholder="Current condition, key events..." value={handover.patientSummary} onChange={(e) => setHandover(h => ({ ...h, patientSummary: e.target.value }))} /></div><div><Label>Pending Tasks (one per line)</Label><textarea className="w-full p-3 border rounded-lg min-h-[60px] resize-none" placeholder="Give medication at 10pm&#10;Check vitals at midnight" value={handover.pendingTasks} onChange={(e) => setHandover(h => ({ ...h, pendingTasks: e.target.value }))} /></div><div><Label>Alerts (one per line)</Label><textarea className="w-full p-3 border rounded-lg min-h-[60px] resize-none" placeholder="Fall risk&#10;NPO after midnight" value={handover.alerts} onChange={(e) => setHandover(h => ({ ...h, alerts: e.target.value }))} /></div></div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowHandoverModal(false)}>Cancel</Button><Button onClick={handleHandover} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Submit Handover</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
