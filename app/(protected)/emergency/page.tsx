"use client";

import { useEffect, useState } from 'react';
import { AlertCircle, Clock, Activity, Search, RefreshCw, Stethoscope, Pill, Megaphone, Plus, MoreVertical, X, Users, Ambulance, Syringe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

// Interfaces
interface EmergencyPatient {
    id: string; // encounterId
    patient: {
        id: string;
        name: string;
        uhid: string;
        gender: string;
        age: number;
        allergies: any[];
    };
    triageColor: 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN' | null;
    priority: string;
    arrivalTime: string;
    waitingFor: string | null;
    vitalSigns: any[];
    bedAssignments: any[];
}

interface Stats {
    total: number;
    critical: number;
    untriaged: number;
    avgWaitMinutes: number;
}

const EMERGENCY_MEDS = [
    { id: 'm1', name: 'Adrenaline', dose: '1mg', route: 'IV' },
    { id: 'm2', name: 'Atropine', dose: '0.5mg', route: 'IV' },
    { id: 'm3', name: 'Aspirin', dose: '300mg', route: 'PO' },
    { id: 'm4', name: 'Nitroglycerin', dose: '0.4mg', route: 'SL' },
    { id: 'm5', name: 'Morphine', dose: '2mg', route: 'IV' },
    { id: 'm6', name: 'Ondansetron', dose: '4mg', route: 'IV' },
];

export default function EmergencyDashboard() {
    const { toast } = useToast();
    const [patients, setPatients] = useState<EmergencyPatient[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, critical: 0, untriaged: 0, avgWaitMinutes: 0 });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Action States
    const [selectedPatient, setSelectedPatient] = useState<EmergencyPatient | null>(null);
    const [showMedsModal, setShowMedsModal] = useState(false);
    const [showArrivalModal, setShowArrivalModal] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Forms
    const [newPatient, setNewPatient] = useState({
        name: '', age: '', gender: 'Male', complaint: '',
        triageColor: 'YELLOW',
        bpSystolic: '', bpDiastolic: '', pulse: '', spO2: '', temp: '',
        isMLC: false, mlcType: 'Accident', policeStation: ''
    });

    const [customMed, setCustomMed] = useState({ name: '', dose: '', route: 'IV' });

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/emergency');
            const data = await res.json();
            if (res.ok) {
                setPatients(data.data || []);
                setStats(data.stats || { total: 0, critical: 0, untriaged: 0, avgWaitMinutes: 0 });
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(interval);
    }, []);

    // Get Wait Time
    const getWaitTime = (arrivalTime: string) => {
        const arrival = new Date(arrivalTime);
        const diffMs = currentTime.getTime() - arrival.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours > 0) return `${hours}h ${mins}m`;
        return `${mins}m`;
    };

    const getTriageColor = (color: string | null) => {
        switch (color) {
            case 'RED': return 'bg-red-100 border-red-500 text-red-900 dark:bg-red-950/40 dark:border-red-600 dark:text-red-100';
            case 'ORANGE': return 'bg-orange-100 border-orange-500 text-orange-900 dark:bg-orange-950/40 dark:border-orange-600 dark:text-orange-100';
            case 'YELLOW': return 'bg-yellow-100 border-yellow-500 text-yellow-900 dark:bg-yellow-950/40 dark:border-yellow-600 dark:text-yellow-100';
            case 'GREEN': return 'bg-green-100 border-green-500 text-green-900 dark:bg-green-950/40 dark:border-green-600 dark:text-green-100';
            default: return 'bg-muted';
        }
    };

    // Actions
    const handleCallDoctor = async (patient: EmergencyPatient) => {
        try {
            toast({ title: 'Calling Doctor...', description: `Paging doctor for ${patient.patient.name}` });
            await fetch('/api/emergency?action=call-doctor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encounterId: patient.id, patientId: patient.patient.id, reason: 'Emergency Request' })
            });
            toast({ title: 'Success', description: 'Doctor has been notified.' });
        } catch { }
    };

    const handleOrderMeds = async (medName: string, dose: string, route: string) => {
        if (!selectedPatient) return;
        setProcessing(true);
        try {
            const res = await fetch('/api/emergency?action=order-meds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedPatient.id,
                    patientId: selectedPatient.patient.id,
                    medicationName: medName,
                    dosage: dose,
                    route: route
                })
            });
            if (res.ok) {
                toast({ title: 'Order Placed', description: `STAT ${medName} ordered.` });
                setShowMedsModal(false);
            }
        } catch { }
        finally { setProcessing(false); }
    };

    const handleNewArrival = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/emergency?action=new-arrival', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newPatient,
                    mlcDetails: newPatient.isMLC ? { type: newPatient.mlcType, policeStation: newPatient.policeStation } : null
                })
            });
            if (res.ok) {
                toast({ title: 'Registered', description: 'New patient registered successfully.' });
                setShowArrivalModal(false);
                fetchPatients();
            }
        } catch { }
        finally { setProcessing(false); }
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in pb-20">
            {/* Header & Stats */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-destructive">
                        <AlertCircle className="w-8 h-8" /> Emergency Track
                    </h1>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={fetchPatients}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
                        <Button className="bg-destructive hover:bg-destructive/90" onClick={() => setShowArrivalModal(true)}><Plus className="w-4 h-4 mr-2" /> New Arrival</Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-blue-50/50 dark:bg-blue-900/20"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Active Patients</p><p className="text-2xl font-bold">{stats.total}</p></div><Users className="w-8 h-8 text-blue-500 opacity-50" /></CardContent></Card>
                    <Card className="bg-red-50/50 dark:bg-red-900/20"><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-destructive font-medium">Critical (Red)</p><p className="text-2xl font-bold text-destructive">{stats.critical}</p></div><Ambulance className="w-8 h-8 text-destructive opacity-50" /></CardContent></Card>
                    <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Untriaged</p><p className="text-2xl font-bold">{stats.untriaged}</p></div><Stethoscope className="w-8 h-8 opacity-20" /></CardContent></Card>
                    <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Avg Wait</p><p className="text-2xl font-bold">{stats.avgWaitMinutes}m</p></div><Clock className="w-8 h-8 opacity-20" /></CardContent></Card>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {patients.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-muted-foreground border-2 border-dashed rounded-xl">No active emergency patients.</div>
                ) : (
                    patients.map(patient => (
                        <Card key={patient.id} className={cn("border-l-8 hover:shadow-md transition-all", getTriageColor(patient.triageColor))}>
                            <CardHeader className="pb-2 p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center font-bold text-lg shadow-sm border">
                                            {patient.patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base truncate max-w-[120px]" title={patient.patient.name}>{patient.patient.name}</CardTitle>
                                            <p className="text-xs font-mono opacity-80">{patient.patient.uhid}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="bg-background/80backdrop-blur mb-1 block shadow-sm border-0 font-bold">
                                            {patient.triageColor || 'NONE'}
                                        </Badge>
                                        <span className="text-xs font-bold flex items-center justify-end gap-1">
                                            <Clock className="w-3 h-3" /> {getWaitTime(patient.arrivalTime)}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0 pb-2">
                                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                                    <div className="bg-background/40 p-1.5 rounded border border-transparent hover:border-border/50 transition-colors">
                                        <span className="text-[10px] uppercase tracking-wider opacity-70 block">BP / Pulse</span>
                                        <span className="font-semibold">{patient.vitalSigns[0]?.bpSystolic || '-'}/{patient.vitalSigns[0]?.bpDiastolic || '-'} <span className="text-xs text-muted-foreground">/ {patient.vitalSigns[0]?.pulse || '-'}</span></span>
                                    </div>
                                    <div className="bg-background/40 p-1.5 rounded border border-transparent hover:border-border/50 transition-colors">
                                        <span className="text-[10px] uppercase tracking-wider opacity-70 block">SpO2</span>
                                        <span className={cn("font-semibold", (patient.vitalSigns[0]?.spO2 || 100) < 95 ? "text-destructive animate-pulse" : "")}>
                                            {patient.vitalSigns[0]?.spO2 || '-'}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-2 bg-background/30 flex gap-2">
                                <Button size="sm" className="flex-1 h-8 text-xs bg-white text-black hover:bg-slate-100 border shadow-sm" onClick={() => handleCallDoctor(patient)}>
                                    <Megaphone className="w-3 h-3 mr-1.5 text-blue-600" /> Doc
                                </Button>
                                <Button size="sm" className="flex-1 h-8 text-xs bg-white text-black hover:bg-slate-100 border shadow-sm" onClick={() => { setSelectedPatient(patient); setShowMedsModal(true); }}>
                                    <Pill className="w-3 h-3 mr-1.5 text-red-600" /> Meds
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>

            {/* Quick Meds Modal */}
            <Dialog open={showMedsModal} onOpenChange={setShowMedsModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>STAT Medication</DialogTitle>
                        <DialogDescription>1-Click order for {selectedPatient?.patient.name}</DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="quick">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="quick">Quick Order</TabsTrigger>
                            <TabsTrigger value="custom">Custom</TabsTrigger>
                        </TabsList>
                        <TabsContent value="quick" className="space-y-2 mt-4">
                            <div className="grid grid-cols-2 gap-3">
                                {EMERGENCY_MEDS.map(med => (
                                    <Button key={med.id} variant="outline" className="h-auto py-3 justify-start flex-col items-start gap-1 hover:border-primary/50" onClick={() => handleOrderMeds(med.name, med.dose, med.route)} disabled={processing}>
                                        <span className="font-bold flex items-center w-full justify-between">
                                            {med.name}
                                            <Badge variant="secondary" className="text-[10px] bg-primary/10">{med.route}</Badge>
                                        </span>
                                        <span className="text-xs text-muted-foreground">{med.dose}</span>
                                    </Button>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="custom" className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label>Medication Name</Label>
                                <Input placeholder="e.g. Furosemide" value={customMed.name} onChange={e => setCustomMed({ ...customMed, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Dose</Label>
                                    <Input placeholder="e.g. 40mg" value={customMed.dose} onChange={e => setCustomMed({ ...customMed, dose: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Route</Label>
                                    <Select value={customMed.route} onValueChange={v => setCustomMed({ ...customMed, route: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="IV">IV</SelectItem>
                                            <SelectItem value="IM">IM</SelectItem>
                                            <SelectItem value="PO">PO</SelectItem>
                                            <SelectItem value="SL">SL</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <Button className="w-full" onClick={() => handleOrderMeds(customMed.name, customMed.dose, customMed.route)} disabled={!customMed.name || processing}>Place Order</Button>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            {/* New Arrival Modal */}
            <Dialog open={showArrivalModal} onOpenChange={setShowArrivalModal}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>New Emergency Arrival</DialogTitle>
                        <DialogDescription>Quick Registration & Triage</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Full Name</Label><Input placeholder="John Doe" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} /></div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="35" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} /></div>
                                <div className="space-y-2"><Label>Gender</Label>
                                    <Select value={newPatient.gender} onValueChange={v => setNewPatient({ ...newPatient, gender: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2"><Label>Presenting Complaint</Label><Textarea placeholder="e.g. Chest pain, RTA..." value={newPatient.complaint} onChange={e => setNewPatient({ ...newPatient, complaint: e.target.value })} /></div>

                        <div className="space-y-2">
                            <Label>Initial Triage</Label>
                            <div className="flex gap-2">
                                {['RED', 'ORANGE', 'YELLOW', 'GREEN'].map(c => (
                                    <div key={c} className={cn("flex-1 p-3 rounded-lg border-2 cursor-pointer text-center font-bold text-sm transition-all",
                                        newPatient.triageColor === c ? "border-black scale-105 shadow-md" : "border-transparent opacity-60 hover:opacity-100",
                                        c === 'RED' ? 'bg-red-200 text-red-900' : c === 'ORANGE' ? 'bg-orange-200 text-orange-900' : c === 'YELLOW' ? 'bg-yellow-200 text-yellow-900' : 'bg-green-200 text-green-900'
                                    )} onClick={() => setNewPatient({ ...newPatient, triageColor: c })}>
                                        {c}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                            <Label className="mb-2 block">Vitals (Optional)</Label>
                            <div className="grid grid-cols-5 gap-2">
                                <div><Input placeholder="Sys" value={newPatient.bpSystolic} onChange={e => setNewPatient({ ...newPatient, bpSystolic: e.target.value })} /><span className="text-[10px] text-muted-foreground">BP Sys</span></div>
                                <div><Input placeholder="Dia" value={newPatient.bpDiastolic} onChange={e => setNewPatient({ ...newPatient, bpDiastolic: e.target.value })} /><span className="text-[10px] text-muted-foreground">BP Dia</span></div>
                                <div><Input placeholder="Pulse" value={newPatient.pulse} onChange={e => setNewPatient({ ...newPatient, pulse: e.target.value })} /><span className="text-[10px] text-muted-foreground">Pulse</span></div>
                                <div><Input placeholder="SpO2" value={newPatient.spO2} onChange={e => setNewPatient({ ...newPatient, spO2: e.target.value })} /><span className="text-[10px] text-muted-foreground">SpO2</span></div>
                                <div><Input placeholder="Temp" value={newPatient.temp} onChange={e => setNewPatient({ ...newPatient, temp: e.target.value })} /><span className="text-[10px] text-muted-foreground">Temp</span></div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2 border p-3 rounded-md bg-destructive/5 border-destructive/20">
                            <Checkbox id="mlc" checked={newPatient.isMLC} onCheckedChange={(c) => setNewPatient({ ...newPatient, isMLC: c as boolean })} />
                            <div className="grid gap-1.5 leading-none">
                                <Label htmlFor="mlc" className="text-destructive font-bold">Medico-Legal Case (MLC)</Label>
                                <p className="text-sm text-muted-foreground">Check if this is an accident or police case.</p>
                            </div>
                        </div>

                        {newPatient.isMLC && (
                            <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
                                <div className="space-y-2"><Label>Type</Label>
                                    <Select value={newPatient.mlcType} onValueChange={v => setNewPatient({ ...newPatient, mlcType: v })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Accident">Accident</SelectItem><SelectItem value="Assault">Assault</SelectItem><SelectItem value="Poisoning">Poisoning</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label>Police Station</Label><Input placeholder="Station Name" value={newPatient.policeStation} onChange={e => setNewPatient({ ...newPatient, policeStation: e.target.value })} /></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowArrivalModal(false)}>Cancel</Button>
                        <Button className="bg-destructive hover:bg-destructive/90" onClick={handleNewArrival} disabled={!newPatient.name || !newPatient.age || processing}>Register</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
