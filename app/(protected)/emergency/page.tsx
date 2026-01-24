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
        <div className="p-6 space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto font-inter">
            {/* Header & Stats */}
            <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center shadow-lg shadow-rose-200">
                                <AlertCircle className="w-6 h-6 text-white" />
                            </div>
                            Emergency Department
                        </h1>
                        <p className="text-slate-500 mt-2 ml-1 text-base">
                            Real-time triage and casualty management dashboard.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-sm">
                        <Button 
                            variant="ghost" 
                            onClick={fetchPatients}
                            className="text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </Button>
                        <div className="h-6 w-px bg-slate-200" />
                        <Button 
                            className="bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-200 rounded-xl gap-2" 
                            onClick={() => setShowArrivalModal(true)}
                        >
                            <Plus className="w-4 h-4" />
                            New Arrival
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 opacity-50" />
                        <CardContent className="p-5 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Patients</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-rose-100 shadow-sm rounded-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50 rounded-full -mr-8 -mt-8 opacity-50" />
                        <CardContent className="p-5 flex items-center justify-between relative z-10">
                            <div>
                                <p className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    Critical
                                </p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.critical}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                <Ambulance className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden relative">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Untriaged</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.untriaged}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden relative">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Wait Time</p>
                                <p className="text-3xl font-bold text-slate-900 mt-1">{stats.avgWaitMinutes}m</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
                                <Clock className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {patients.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm">
                            <Activity className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-lg font-medium text-slate-600">No active emergency patients</p>
                        <p className="text-sm">New arrivals will appear here instantly</p>
                    </div>
                ) : (
                    patients.map(patient => (
                        <Card key={patient.id} className={cn(
                            "group hover:shadow-lg transition-all duration-300 border overflow-hidden",
                            patient.triageColor === 'RED' ? 'border-l-8 border-l-rose-500 border-t-slate-100 border-r-slate-100 border-b-slate-100' :
                            patient.triageColor === 'ORANGE' ? 'border-l-8 border-l-orange-500 border-t-slate-100 border-r-slate-100 border-b-slate-100' :
                            patient.triageColor === 'YELLOW' ? 'border-l-8 border-l-yellow-500 border-t-slate-100 border-r-slate-100 border-b-slate-100' :
                            patient.triageColor === 'GREEN' ? 'border-l-8 border-l-emerald-500 border-t-slate-100 border-r-slate-100 border-b-slate-100' :
                            'border-slate-100'
                        )}>
                            <CardHeader className="p-5 pb-3 bg-white">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-700 shadow-inner">
                                            {patient.patient.name.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-bold text-slate-900 truncate max-w-[140px]" title={patient.patient.name}>
                                                {patient.patient.name}
                                            </CardTitle>
                                            <p className="text-xs font-mono text-slate-500 mt-1 bg-slate-50 px-1.5 py-0.5 rounded w-fit">
                                                {patient.patient.uhid}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end">
                                        <Badge variant="outline" className={cn(
                                            "mb-1 border-0 font-bold px-2 py-0.5 rounded-lg shadow-sm",
                                            patient.triageColor === 'RED' ? 'bg-rose-100 text-rose-700' :
                                            patient.triageColor === 'ORANGE' ? 'bg-orange-100 text-orange-700' :
                                            patient.triageColor === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-emerald-100 text-emerald-700'
                                        )}>
                                            {patient.triageColor || 'NONE'}
                                        </Badge>
                                        <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {getWaitTime(patient.arrivalTime)}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 pt-0 pb-4 bg-white">
                                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-slate-200 transition-colors overflow-hidden">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5 truncate">BP / Pulse</span>
                                        <span className="font-bold text-slate-700 truncate block" title={`${patient.vitalSigns[0]?.bpSystolic || '-'}/${patient.vitalSigns[0]?.bpDiastolic || '-'} / ${patient.vitalSigns[0]?.pulse || '-'}`}>
                                            {patient.vitalSigns[0]?.bpSystolic || '-'}/{patient.vitalSigns[0]?.bpDiastolic || '-'} 
                                            <span className="text-xs text-slate-400 font-normal ml-1">/ {patient.vitalSigns[0]?.pulse || '-'}</span>
                                        </span>
                                    </div>
                                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 group-hover:border-slate-200 transition-colors overflow-hidden">
                                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-0.5 truncate">SpO2</span>
                                        <span className={cn("font-bold text-slate-700 truncate block", (patient.vitalSigns[0]?.spO2 || 100) < 95 ? "text-rose-600 animate-pulse" : "")}>
                                            {patient.vitalSigns[0]?.spO2 ? Math.round(patient.vitalSigns[0]?.spO2) : '-'}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-3 bg-slate-50 border-t border-slate-100 flex gap-3">
                                <Button size="sm" className="flex-1 h-9 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-sm rounded-lg" onClick={() => handleCallDoctor(patient)}>
                                    <Megaphone className="w-3.5 h-3.5 mr-2 text-indigo-500" /> Call Doctor
                                </Button>
                                <Button size="sm" className="flex-1 h-9 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 shadow-sm rounded-lg" onClick={() => { setSelectedPatient(patient); setShowMedsModal(true); }}>
                                    <Pill className="w-3.5 h-3.5 mr-2 text-rose-500" /> Order Meds
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                )}
            </div>

            {/* Quick Meds Modal */}
            <Dialog open={showMedsModal} onOpenChange={setShowMedsModal}>
                <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="p-6 pb-2 bg-slate-50 border-b border-slate-100">
                        <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                <Pill className="w-4 h-4 text-rose-600" />
                            </div>
                            STAT Medication
                        </DialogTitle>
                        <DialogDescription className="text-slate-500">Fast-track order for <span className="font-semibold text-slate-900">{selectedPatient?.patient.name}</span></DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6">
                        <Tabs defaultValue="quick" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl mb-6">
                                <TabsTrigger value="quick" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Quick Order</TabsTrigger>
                                <TabsTrigger value="custom" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Custom</TabsTrigger>
                            </TabsList>
                            <TabsContent value="quick" className="mt-0">
                                <div className="grid grid-cols-2 gap-3">
                                    {EMERGENCY_MEDS.map(med => (
                                        <Button 
                                            key={med.id} 
                                            variant="outline" 
                                            className="h-auto py-3 px-4 justify-start flex-col items-start gap-1 border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all group" 
                                            onClick={() => handleOrderMeds(med.name, med.dose, med.route)} 
                                            disabled={processing}
                                        >
                                            <span className="font-bold text-slate-700 group-hover:text-rose-700 flex items-center w-full justify-between text-sm">
                                                {med.name}
                                                <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-rose-600">{med.route}</Badge>
                                            </span>
                                            <span className="text-xs text-slate-400 group-hover:text-rose-600/70">{med.dose}</span>
                                        </Button>
                                    ))}
                                </div>
                            </TabsContent>
                            <TabsContent value="custom" className="space-y-5 mt-0">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Medication Name</Label>
                                    <Input className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" placeholder="e.g. Furosemide" value={customMed.name} onChange={e => setCustomMed({ ...customMed, name: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dose</Label>
                                        <Input className="bg-slate-50 border-slate-200 focus:bg-white transition-colors" placeholder="e.g. 40mg" value={customMed.dose} onChange={e => setCustomMed({ ...customMed, dose: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Route</Label>
                                        <Select value={customMed.route} onValueChange={v => setCustomMed({ ...customMed, route: v })}>
                                            <SelectTrigger className="bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IV">IV</SelectItem>
                                                <SelectItem value="IM">IM</SelectItem>
                                                <SelectItem value="PO">PO</SelectItem>
                                                <SelectItem value="SL">SL</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-12 shadow-lg shadow-slate-200 mt-2" onClick={() => handleOrderMeds(customMed.name, customMed.dose, customMed.route)} disabled={!customMed.name || processing}>Place Order</Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>

            {/* New Arrival Modal */}
            <Dialog open={showArrivalModal} onOpenChange={setShowArrivalModal}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border-0 shadow-2xl">
                    <DialogHeader className="p-6 pb-4 bg-slate-900 text-white">
                         <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm">
                                <Ambulance className="w-5 h-5 text-white" />
                            </div>
                            <DialogTitle className="text-xl">New Emergency Arrival</DialogTitle>
                         </div>
                        <DialogDescription className="text-slate-300 ml-13">Quick Registration & Triage Protocol</DialogDescription>
                    </DialogHeader>
                    
                    <div className="p-6 grid gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</Label>
                                <Input className="h-10 bg-slate-50 border-slate-200" placeholder="John Doe" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age</Label>
                                    <Input className="h-10 bg-slate-50 border-slate-200" type="number" placeholder="35" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</Label>
                                    <Select value={newPatient.gender} onValueChange={v => setNewPatient({ ...newPatient, gender: v })}>
                                        <SelectTrigger className="h-10 bg-slate-50 border-slate-200"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Presenting Complaint</Label>
                            <Textarea className="bg-slate-50 border-slate-200 min-h-[80px]" placeholder="e.g. Chest pain, RTA, difficulty breathing..." value={newPatient.complaint} onChange={e => setNewPatient({ ...newPatient, complaint: e.target.value })} />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" /> Initial Triage
                            </Label>
                            <div className="flex gap-3">
                                {['RED', 'ORANGE', 'YELLOW', 'GREEN'].map(c => (
                                    <div key={c} className={cn("flex-1 p-3 rounded-xl border-2 cursor-pointer text-center transition-all duration-200",
                                        newPatient.triageColor === c ? "scale-105 shadow-md ring-2 ring-offset-2 ring-slate-100" : "opacity-60 hover:opacity-100 hover:bg-slate-50 border-transparent",
                                        c === 'RED' ? (newPatient.triageColor === c ? 'bg-rose-100 text-rose-800 border-rose-500' : 'bg-rose-50 text-rose-800') : 
                                        c === 'ORANGE' ? (newPatient.triageColor === c ? 'bg-orange-100 text-orange-800 border-orange-500' : 'bg-orange-50 text-orange-800') : 
                                        c === 'YELLOW' ? (newPatient.triageColor === c ? 'bg-yellow-100 text-yellow-800 border-yellow-500' : 'bg-yellow-50 text-yellow-800') : 
                                        (newPatient.triageColor === c ? 'bg-emerald-100 text-emerald-800 border-emerald-500' : 'bg-emerald-50 text-emerald-800')
                                    )} onClick={() => setNewPatient({ ...newPatient, triageColor: c })}>
                                        <span className="font-bold text-sm block">{c}</span>
                                        <span className="text-[10px] opacity-80 font-medium uppercase tracking-wide">
                                            {c === 'RED' ? 'Critical' : c === 'ORANGE' ? 'High Risk' : c === 'YELLOW' ? 'Urgent' : 'Standard'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Vitals (Optional)</Label>
                            <div className="grid grid-cols-5 gap-3">
                                <div><Input className="h-9 text-center bg-white" placeholder="-" value={newPatient.bpSystolic} onChange={e => setNewPatient({ ...newPatient, bpSystolic: e.target.value })} /><span className="text-[10px] text-slate-400 text-center block mt-1">BP Sys</span></div>
                                <div><Input className="h-9 text-center bg-white" placeholder="-" value={newPatient.bpDiastolic} onChange={e => setNewPatient({ ...newPatient, bpDiastolic: e.target.value })} /><span className="text-[10px] text-slate-400 text-center block mt-1">BP Dia</span></div>
                                <div><Input className="h-9 text-center bg-white" placeholder="-" value={newPatient.pulse} onChange={e => setNewPatient({ ...newPatient, pulse: e.target.value })} /><span className="text-[10px] text-slate-400 text-center block mt-1">Pulse</span></div>
                                <div><Input className="h-9 text-center bg-white" placeholder="-" value={newPatient.spO2} onChange={e => setNewPatient({ ...newPatient, spO2: e.target.value })} /><span className="text-[10px] text-slate-400 text-center block mt-1">SpO2</span></div>
                                <div><Input className="h-9 text-center bg-white" placeholder="-" value={newPatient.temp} onChange={e => setNewPatient({ ...newPatient, temp: e.target.value })} /><span className="text-[10px] text-slate-400 text-center block mt-1">Temp</span></div>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3 border border-rose-100 p-4 rounded-xl bg-rose-50/50 hover:bg-rose-50 transition-colors">
                            <Checkbox id="mlc" className="border-rose-300 data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600 text-white" checked={newPatient.isMLC} onCheckedChange={(c) => setNewPatient({ ...newPatient, isMLC: c as boolean })} />
                            <div className="grid gap-0.5 leading-none">
                                <Label htmlFor="mlc" className="text-rose-700 font-bold text-sm cursor-pointer">Medico-Legal Case (MLC)</Label>
                                <p className="text-xs text-rose-600/70">Check if this is an accident, assault, or police case.</p>
                            </div>
                        </div>

                        {newPatient.isMLC && (
                            <div className="grid grid-cols-2 gap-6 animate-in slide-in-from-top-2 p-4 bg-rose-50/50 rounded-xl border border-rose-100 -mt-2">
                                <div className="space-y-2"><Label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Type</Label>
                                    <Select value={newPatient.mlcType} onValueChange={v => setNewPatient({ ...newPatient, mlcType: v })}>
                                        <SelectTrigger className="bg-white border-rose-200"><SelectValue /></SelectTrigger>
                                        <SelectContent><SelectItem value="Accident">Accident</SelectItem><SelectItem value="Assault">Assault</SelectItem><SelectItem value="Poisoning">Poisoning</SelectItem></SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2"><Label className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Police Station</Label><Input className="bg-white border-rose-200" placeholder="Station Name" value={newPatient.policeStation} onChange={e => setNewPatient({ ...newPatient, policeStation: e.target.value })} /></div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="p-6 pt-2 bg-white border-t border-slate-100 gap-3">
                        <Button variant="outline" onClick={() => setShowArrivalModal(false)} className="h-11 px-6 rounded-xl border-slate-200">Cancel</Button>
                        <Button className="bg-rose-600 hover:bg-rose-700 text-white h-11 px-8 rounded-xl shadow-lg shadow-rose-200" onClick={handleNewArrival} disabled={!newPatient.name || !newPatient.age || processing}>
                            {processing ? 'Registering...' : 'Register Patient'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
