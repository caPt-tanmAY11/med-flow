"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import { Heart, Clock, CheckCircle, AlertTriangle, Users, Loader2, X, Plus, Activity, FileText, ClipboardList, ArrowRightLeft, BedDouble, Thermometer, Stethoscope, Lock, ShieldCheck, Eye, AlertCircle, Calendar, LogOut, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper to format date
const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

// Interfaces
interface Patient {
    id: string;
    uhid: string;
    name: string;
    gender: string;
    dob: string;
    bloodGroup?: string;
    allergies: { allergen: string; severity: string }[];
}

interface NurseDuty {
    id: string;
    nurseId: string;
    nurseName: string;
    shiftType: string;
    checkInAt: string | null;
    ward: string | null;
    assignmentCount: number;
    hasCode: boolean;
}

interface VitalSign {
    id: string;
    recordedAt: string;
    recordedBy: string;
    temperature: number | null;
    pulse: number | null;
    respRate: number | null;
    bpSystolic: number | null;
    bpDiastolic: number | null;
    spO2: number | null;
    isCritical: boolean;
}

interface ActivePatient {
    id: string; // Encounter ID
    patient: Patient;
    department: string | null;
    bedAssignments: { bed: { bedNumber: string; ward: string } }[];
    assignedNurse: { nurseId: string; nurseName: string } | null;
    vitalSigns: VitalSign[];
    clinicalNotes: any[];
    carePlan?: any;
    prescriptions?: any[];
}

export default function NursePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);

    // Auth State
    const [currentNurse, setCurrentNurse] = useState<NurseDuty | null>(null);
    const [selectedNurseId, setSelectedNurseId] = useState<string>(''); // For login dropdown
    const [loginCode, setLoginCode] = useState('');
    const [isLocked, setIsLocked] = useState(true);

    // Data State
    const [activePatients, setActivePatients] = useState<ActivePatient[]>([]);
    const [nursesOnDuty, setNursesOnDuty] = useState<NurseDuty[]>([]);
    const [recentHandovers, setRecentHandovers] = useState<any[]>([]);

    // Modals
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showCarePlanModal, setShowCarePlanModal] = useState(false);
    const [showReverifyModal, setShowReverifyModal] = useState(false);

    const [selectedPatient, setSelectedPatient] = useState<ActivePatient | null>(null);
    const [reverifyCode, setReverifyCode] = useState('');
    const [checking, setChecking] = useState(false);
    const [saving, setSaving] = useState(false);

    // Pending action after reverification
    const pendingAction = useRef<() => void | null>(null);

    // Vitals form
    const [vitals, setVitals] = useState({ temperature: '', pulse: '', respRate: '', bpSystolic: '', bpDiastolic: '', spO2: '', painScore: '', notes: '' });

    // Handover form
    const [handover, setHandover] = useState({ incomingNurse: '', patientSummary: '', pendingTasks: '', alerts: '', handoverNotes: '' });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch all data generally first, we filter by nurse locally or refetch if needed
            const response = await fetch(`/api/nursing`);
            const result = await response.json();
            setActivePatients(result.data?.activePatients || []);
            setNursesOnDuty(result.data?.nursesOnDuty || []);
            setRecentHandovers(result.data?.recentHandovers || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
            toast({ title: 'Error', description: 'Failed to load nursing data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
        // Check session storage for existing login
        const storedNurse = sessionStorage.getItem('nurseSession');
        if (storedNurse) {
            try {
                const nurse = JSON.parse(storedNurse);
                setCurrentNurse(nurse);
                setIsLocked(false);
            } catch (e) { }
        }
    }, [fetchData]);

    // --- Authentication Actions ---

    const handleLogin = async () => {
        if (!selectedNurseId || loginCode.length !== 4) return;
        setChecking(true);
        try {
            // Find nurse details
            const nurse = nursesOnDuty.find(n => n.nurseId === selectedNurseId);
            if (!nurse) {
                toast({ title: 'Error', description: 'Nurse not found', variant: 'destructive' });
                return;
            }

            const response = await fetch('/api/nursing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: selectedNurseId, nurseName: nurse.nurseName, code: loginCode }),
            });
            const result = await response.json();

            if (response.ok) {
                setCurrentNurse(nurse);
                setIsLocked(false);
                sessionStorage.setItem('nurseSession', JSON.stringify(nurse));
                toast({ title: 'Welcome', description: `Logged in as ${nurse.nurseName}` });
                setLoginCode('');
            } else {
                toast({ title: 'Access Denied', description: result.error || 'Invalid code', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Login failed', variant: 'destructive' });
        } finally {
            setChecking(false);
        }
    };

    const handleLogout = () => {
        setCurrentNurse(null);
        setIsLocked(true);
        setSelectedNurseId('');
        setLoginCode('');
        sessionStorage.removeItem('nurseSession');
        toast({ title: 'Logged Out', description: 'Station locked successfully' });
    };

    // --- Security Verification for Actions ---

    const verifyActionCode = async (code: string) => {
        if (!currentNurse) return false;
        try {
            const res = await fetch('/api/nursing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: currentNurse.nurseId, nurseName: currentNurse.nurseName, code }),
            });
            return res.ok;
        } catch { return false; }
    };

    const handleReverify = async () => {
        setChecking(true);
        try {
            const isValid = await verifyActionCode(reverifyCode);
            if (isValid) {
                setShowReverifyModal(false);
                setReverifyCode('');
                if (pendingAction.current) {
                    pendingAction.current();
                    pendingAction.current = null;
                }
            } else {
                toast({ title: 'Verification Failed', description: 'Invalid code', variant: 'destructive' });
            }
        } finally {
            setChecking(false);
        }
    };

    const withVerification = (action: () => void) => {
        pendingAction.current = action;
        setShowReverifyModal(true);
    };

    // --- Dashboard Actions ---

    const handleLogVitals = async () => {
        if (!selectedPatient || !currentNurse) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing/vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedPatient.id,
                    patientId: selectedPatient.patient.id,
                    nurseId: currentNurse.nurseId,
                    nurseName: currentNurse.nurseName,
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
            const result = await response.json();
            if (response.ok) {
                if (result.isCritical) {
                    toast({ title: '⚠️ CRITICAL VALUES', description: 'Escalated to doctor!', variant: 'destructive' });
                } else {
                    toast({ title: 'Success', description: 'Vitals logged successfully' });
                }
                setShowVitalsModal(false);
                setVitals({ temperature: '', pulse: '', respRate: '', bpSystolic: '', bpDiastolic: '', spO2: '', painScore: '', notes: '' });
                fetchData();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to log vitals', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    const handleHandover = async () => {
        if (!selectedPatient || !currentNurse || !handover.incomingNurse) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing?action=handover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedPatient.id,
                    outgoingNurse: currentNurse.nurseName,
                    incomingNurse: handover.incomingNurse,
                    patientSummary: handover.patientSummary,
                    pendingTasks: handover.pendingTasks.split('\n').filter(t => t.trim()),
                    alerts: handover.alerts.split('\n').filter(a => a.trim()),
                    handoverNotes: handover.handoverNotes,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Handover created successfully' });
                setShowHandoverModal(false);
                setHandover({ incomingNurse: '', patientSummary: '', pendingTasks: '', alerts: '', handoverNotes: '' });
                fetchData();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to create handover', variant: 'destructive' }); }
        finally { setSaving(false); }
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

    // --- RENDER ---

    if (loading && nursesOnDuty.length === 0) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    // Lock Screen
    if (isLocked) {
        return (
            <div className="fixed inset-0 bg-secondary/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
                <div className="bg-background shadow-2xl rounded-2xl max-w-md w-full p-8 border">
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Heart className="w-10 h-10 text-primary animate-pulse" />
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight">Nurse Login</h1>
                        <p className="text-muted-foreground text-center mt-2">
                            Select your profile and enter your daily code to access the station.
                        </p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label>Who are you?</Label>
                            <Select value={selectedNurseId} onValueChange={setSelectedNurseId}>
                                <SelectTrigger className="h-12">
                                    <SelectValue placeholder="Select Nurse Profile" />
                                </SelectTrigger>
                                <SelectContent>
                                    {nursesOnDuty.length > 0 ? nursesOnDuty.map(n => (
                                        <SelectItem key={n.nurseId} value={n.nurseId}>
                                            {n.nurseName} ({n.shiftType})
                                        </SelectItem>
                                    )) : <div className="p-4 text-center text-sm text-muted-foreground">No nurses on duty</div>}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedNurseId && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 fade-in">
                                <Label>Daily Secret Code</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input
                                        type="password"
                                        placeholder="••••"
                                        className="pl-10 h-12 text-lg tracking-widest"
                                        maxLength={4}
                                        value={loginCode}
                                        onChange={(e) => setLoginCode(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    />
                                </div>
                            </div>
                        )}

                        <Button className="w-full h-12 text-lg" onClick={handleLogin} disabled={checking || !selectedNurseId || loginCode.length !== 4}>
                            {checking ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Unlock Station'}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    const myPatients = activePatients.filter(p => p.assignedNurse?.nurseId === currentNurse?.nurseId);

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4 bg-background p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Heart className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Nursing Station</h1>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            Logged in as <span className="font-semibold text-foreground">{currentNurse?.nurseName}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-sm font-medium">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        <span className="text-xs text-muted-foreground">{currentNurse?.shiftType || 'Shift'} • {currentNurse?.ward || 'General'}</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}><Activity className="w-4 h-4 mr-2" />Refresh</Button>
                    <Button variant="destructive" size="sm" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Lock</Button>
                </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background border-blue-100 dark:border-blue-900">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">My Patients</p>
                        <Users className="w-4 h-4 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold">{myPatients.length}</p>
                </div>
                <div className="kpi-card bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background border-red-100 dark:border-red-900">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Critical Alerts</p>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold">{activePatients.filter(p => p.vitalSigns?.[0]?.isCritical).length}</p>
                </div>
                <div className="kpi-card">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-muted-foreground">Dept. Total</p>
                        <BedDouble className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold">{activePatients.length}</p>
                </div>
                <div className="kpi-card">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-medium text-muted-foreground">My Shift</p>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-bold truncate">{currentNurse?.checkInAt ? new Date(currentNurse.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}</p>
                    <p className="text-xs text-muted-foreground pt-1">Status: On Duty</p>
                </div>
            </div>

            {/* Patient Lists */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* My Assigned Patients - Main Focus */}
                <div className="xl:col-span-2 space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2"><ClipboardList className="w-5 h-5 text-primary" /> My Patient List</h2>

                    {myPatients.length === 0 ? (
                        <div className="border border-dashed rounded-xl p-8 text-center bg-muted/20">
                            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                            <h3 className="font-medium text-lg">No patients assigned</h3>
                            <p className="text-muted-foreground">Ask admin to assign patients to you.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {myPatients.map(patient => {
                                const latestVitals = patient.vitalSigns?.[0];
                                return (
                                    <div key={patient.id} className="bg-card border rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                                        <div className="flex flex-col md:flex-row justify-between gap-4">
                                            {/* Patient Info */}
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary shrink-0">
                                                    {patient.patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-bold">{patient.patient.name}</h3>
                                                        <span className="bg-muted px-2 py-0.5 rounded text-xs font-mono">{patient.patient.uhid}</span>
                                                        {latestVitals?.isCritical && <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-bold animate-pulse">CRITICAL</span>}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {patient.patient.gender} • Bed {patient.bedAssignments?.[0]?.bed.bedNumber || 'Unassigned'} • {patient.department || 'General'}
                                                    </p>
                                                    {patient.patient.allergies?.length > 0 && (
                                                        <p className="text-xs text-destructive mt-1 font-medium flex items-center gap-1">
                                                            <AlertTriangle className="w-3 h-3" /> Allergies: {patient.patient.allergies.map(a => a.allergen).join(', ')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
                                                <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(patient); setShowNotesModal(true); }}>
                                                    <FileText className="w-4 h-4 mr-1" /> Notes
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(patient); setShowHandoverModal(true); }}>
                                                    <ArrowRightLeft className="w-4 h-4 mr-1" /> Handover
                                                </Button>
                                                <Button size="sm" onClick={() => { setSelectedPatient(patient); setShowVitalsModal(true); }} className="bg-primary hover:bg-primary/90">
                                                    <Activity className="w-4 h-4 mr-1" /> Log Vitals
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Vitals Summary Strip */}
                                        <div className="mt-4 pt-4 border-t grid grid-cols-4 md:grid-cols-6 gap-2 text-center">
                                            <div className={cn("p-2 rounded bg-muted/30", isAbnormal('bp', latestVitals?.bpSystolic || 0) && "bg-destructive/10 text-destructive")}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">BP</p>
                                                <p className="font-semibold text-sm">{latestVitals?.bpSystolic || '-'}/{latestVitals?.bpDiastolic || '-'}</p>
                                            </div>
                                            <div className={cn("p-2 rounded bg-muted/30", isAbnormal('pulse', latestVitals?.pulse || 0) && "bg-destructive/10 text-destructive")}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Pulse</p>
                                                <p className="font-semibold text-sm">{latestVitals?.pulse || '-'} <span className="text-[10px] font-normal">bpm</span></p>
                                            </div>
                                            <div className={cn("p-2 rounded bg-muted/30", isAbnormal('temp', latestVitals?.temperature || 0) && "bg-destructive/10 text-destructive")}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Temp</p>
                                                <p className="font-semibold text-sm">{latestVitals?.temperature || '-'} <span className="text-[10px] font-normal">°C</span></p>
                                            </div>
                                            <div className={cn("p-2 rounded bg-muted/30", isAbnormal('spo2', latestVitals?.spO2 || 0) && "bg-destructive/10 text-destructive")}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">SpO2</p>
                                                <p className="font-semibold text-sm">{latestVitals?.spO2 || '-'} <span className="text-[10px] font-normal">%</span></p>
                                            </div>
                                            <div className={cn("p-2 rounded bg-muted/30", isAbnormal('resp', latestVitals?.respRate || 0) && "bg-destructive/10 text-destructive")}>
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Resp</p>
                                                <p className="font-semibold text-sm">{latestVitals?.respRate || '-'} <span className="text-[10px] font-normal">/m</span></p>
                                            </div>
                                            <div className="p-2 rounded bg-muted/30 hidden md:block">
                                                <p className="text-[10px] uppercase text-muted-foreground font-semibold">Updated</p>
                                                <p className="font-semibold text-xs truncate">{latestVitals?.recordedAt ? new Date(latestVitals.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Other Ward Patients (Read Only) */}
                <div className="space-y-4">
                    <h2 className="font-semibold text-lg flex items-center gap-2 text-muted-foreground"><Users className="w-5 h-5" /> Other Patients</h2>
                    <div className="bg-muted/10 border rounded-xl p-4 h-[calc(100vh-300px)] overflow-y-auto">
                        {activePatients.filter(p => p.assignedNurse?.nurseId !== currentNurse?.nurseId).length === 0 ? (
                            <p className="text-center text-sm text-muted-foreground py-4">No other patients in ward.</p>
                        ) : (
                            activePatients.filter(p => p.assignedNurse?.nurseId !== currentNurse?.nurseId).map(patient => (
                                <div key={patient.id} className="p-3 border-b last:border-0 hover:bg-muted/20 rounded transition-colors mb-2">
                                    <div className="flex justify-between">
                                        <div>
                                            <p className="font-medium text-sm">{patient.patient.name}</p>
                                            <p className="text-xs text-muted-foreground">Bed {patient.bedAssignments?.[0]?.bed.bedNumber || 'N/A'}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">{patient.department || 'Gen'}</span>
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <ShieldCheck className="w-3 h-3" /> Assigned to: {patient.assignedNurse?.nurseName || 'Unassigned'}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Vitals Modal */}
            {showVitalsModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">Record Vitals</h2>
                                <p className="text-sm text-muted-foreground">{selectedPatient.patient.name} - {selectedPatient.patient.uhid}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowVitalsModal(false)}><X className="w-4 h-4" /></Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <div><Label>Temp (°C)</Label><Input type="number" step="0.1" placeholder="36.5" value={vitals.temperature} onChange={(e) => setVitals(v => ({ ...v, temperature: e.target.value }))} className={isAbnormal('temp', parseFloat(vitals.temperature)) ? 'border-destructive' : ''} /></div>
                            <div><Label>Pulse (bpm)</Label><Input type="number" placeholder="72" value={vitals.pulse} onChange={(e) => setVitals(v => ({ ...v, pulse: e.target.value }))} className={isAbnormal('pulse', parseInt(vitals.pulse)) ? 'border-destructive' : ''} /></div>
                            <div><Label>BP Sys</Label><Input type="number" placeholder="120" value={vitals.bpSystolic} onChange={(e) => setVitals(v => ({ ...v, bpSystolic: e.target.value }))} className={isAbnormal('bp', parseInt(vitals.bpSystolic)) ? 'border-destructive' : ''} /></div>
                            <div><Label>BP Dia</Label><Input type="number" placeholder="80" value={vitals.bpDiastolic} onChange={(e) => setVitals(v => ({ ...v, bpDiastolic: e.target.value }))} /></div>
                            <div><Label>SpO2 (%)</Label><Input type="number" step="0.1" placeholder="98" value={vitals.spO2} onChange={(e) => setVitals(v => ({ ...v, spO2: e.target.value }))} className={isAbnormal('spo2', parseFloat(vitals.spO2)) ? 'border-destructive' : ''} /></div>
                            <div><Label>Resp (/min)</Label><Input type="number" placeholder="16" value={vitals.respRate} onChange={(e) => setVitals(v => ({ ...v, respRate: e.target.value }))} className={isAbnormal('resp', parseInt(vitals.respRate)) ? 'border-destructive' : ''} /></div>
                            <div><Label>Pain (0-10)</Label><Input type="number" min="0" max="10" placeholder="0" value={vitals.painScore} onChange={(e) => setVitals(v => ({ ...v, painScore: e.target.value }))} /></div>
                            <div className="col-span-2 md:col-span-1"><Label>Notes</Label><Input placeholder="Optional" value={vitals.notes} onChange={(e) => setVitals(v => ({ ...v, notes: e.target.value }))} /></div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowVitalsModal(false)}>Cancel</Button>
                            <Button onClick={() => { setShowVitalsModal(false); withVerification(handleLogVitals); }}>
                                Verify & Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Re-verification Modal */}
            {showReverifyModal && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-background rounded-xl max-w-sm w-full p-6 text-center shadow-xl animate-in zoom-in-95 duration-200">
                        <div className="mb-4 flex justify-center"><ShieldCheck className="w-12 h-12 text-primary" /></div>
                        <h2 className="text-lg font-semibold mb-2">Security Verification</h2>
                        <p className="text-sm text-muted-foreground mb-4">Re-enter your daily code to confirm.</p>

                        <Input
                            type="password"
                            className="text-center text-3xl tracking-widest mb-6 h-14"
                            placeholder="••••"
                            maxLength={4}
                            value={reverifyCode}
                            onChange={(e) => setReverifyCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleReverify()}
                            autoFocus
                        />

                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => { setShowReverifyModal(false); setReverifyCode(''); pendingAction.current = null; }}>Cancel</Button>
                            <Button className="flex-1" onClick={handleReverify} disabled={checking || reverifyCode.length !== 4}>
                                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Use existing notes modal structure or component if available, here basic placeholder for completeness */}
            {showNotesModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-bold">Doctor Notes</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowNotesModal(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        {selectedPatient.clinicalNotes?.length > 0 ? (
                            <div className="space-y-4">
                                {selectedPatient.clinicalNotes.map((note: any) => (
                                    <div key={note.id} className="p-4 border rounded-xl bg-muted/20">
                                        <div className="flex justify-between mb-1">
                                            <span className="font-medium text-sm">{note.noteType}</span>
                                            <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                                        </div>
                                        <p className="text-sm">{note.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-muted-foreground text-center py-8">No notes available.</p>}
                    </div>
                </div>
            )}

            {/* Simple Handover Modal */}
            {showHandoverModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-lg font-bold">Create Handover</h2>
                            <Button variant="ghost" size="sm" onClick={() => setShowHandoverModal(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Incoming Nurse</Label>
                                <Select onValueChange={(v) => setHandover(h => ({ ...h, incomingNurse: v }))}>
                                    <SelectTrigger><SelectValue placeholder="Select Nurse" /></SelectTrigger>
                                    <SelectContent>
                                        {nursesOnDuty.filter(n => n.nurseId !== currentNurse?.nurseId).map(n => (
                                            <SelectItem key={n.nurseId} value={n.nurseName}>{n.nurseName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Patient Summary</Label>
                                <Input value={handover.patientSummary} onChange={(e) => setHandover(h => ({ ...h, patientSummary: e.target.value }))} />
                            </div>
                            <div>
                                <Label>Pending Tasks</Label>
                                <Input value={handover.pendingTasks} onChange={(e) => setHandover(h => ({ ...h, pendingTasks: e.target.value }))} placeholder="Task 1, Task 2" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={() => setShowHandoverModal(false)}>Cancel</Button>
                                <Button onClick={handleHandover} disabled={saving}>Create Handover</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
