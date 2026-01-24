"use client";

import { useEffect, useState, useCallback } from 'react';
import { Heart, Clock, CheckCircle, AlertTriangle, Users, Loader2, X, Plus, Activity, FileText, ClipboardList, ArrowRightLeft, BedDouble, Thermometer, Stethoscope, Lock, ShieldCheck, Eye, AlertCircle, Calendar } from 'lucide-react';
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
    dob: string;
    allergies: { allergen: string; severity: string }[];
}

interface Bed {
    id: string;
    bedNumber: string;
    ward: string;
    type: string;
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

interface ClinicalNote {
    id: string;
    noteType: string;
    content: string;
    authorRole: string;
    createdAt: string;
}

interface CarePlan {
    id: string;
    goals: { goal: string; status: string }[];
    interventions: { dailySchedule?: { time: string; task: string }[] };
}

interface NurseAssignment {
    nurseId: string;
    nurseName: string;
}

interface ActivePatient {
    id: string;
    type: string;
    status: string;
    department: string | null;
    patient: Patient;
    bedAssignments: { bed: Bed }[];
    vitalSigns: VitalSign[];
    clinicalNotes: ClinicalNote[];
    assignedNurse: NurseAssignment | null;
    carePlan: CarePlan | null;
}

interface NurseDuty {
    id: string;
    nurseId: string;
    nurseName: string;
    shiftType: string;
    checkInAt: string | null;
    checkOutAt: string | null;
    ward: string | null;
    assignmentCount?: number;
}

interface ShiftHandover {
    id: string;
    outgoingNurse: string;
    incomingNurse: string;
    handoverAt: string;
    patientSummary: string;
    pendingTasks: string[];
    alerts: string[];
    handoverNotes: string | null;
    acknowledgedAt: string | null;
}

// Simulated nurse context - in real app get from auth
const CURRENT_NURSE = {
    id: 'nurse-1',
    name: 'Sarah Johnson',
};

export default function NursingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activePatients, setActivePatients] = useState<ActivePatient[]>([]);
    const [nursesOnDuty, setNursesOnDuty] = useState<NurseDuty[]>([]);
    const [recentHandovers, setRecentHandovers] = useState<ShiftHandover[]>([]);
    const [isVerified, setIsVerified] = useState(false);

    // Modals
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showCarePlanModal, setShowCarePlanModal] = useState(false);

    const [selectedPatient, setSelectedPatient] = useState<ActivePatient | null>(null);
    const [verifyCode, setVerifyCode] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [saving, setSaving] = useState(false);

    // Vitals form
    const [vitals, setVitals] = useState({
        temperature: '',
        pulse: '',
        respRate: '',
        bpSystolic: '',
        bpDiastolic: '',
        spO2: '',
        painScore: '',
        notes: '',
    });

    // Handover form
    const [handover, setHandover] = useState({
        incomingNurse: '',
        patientSummary: '',
        pendingTasks: '',
        alerts: '',
        handoverNotes: '',
    });

    // Care plan form
    const [carePlan, setCarePlan] = useState({
        goals: '',
        interventions: '',
        dailySchedule: '',
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // First check if seed is needed
            const seedRes = await fetch('/api/nursing/seed');
            const seedData = await seedRes.json();

            // If no nurses on duty, seed the data
            if (seedData.nursesOnDuty === 0) {
                await fetch('/api/nursing/seed', { method: 'POST' });
            }

            const response = await fetch(`/api/nursing?nurseId=${CURRENT_NURSE.id}`);
            const result = await response.json();
            setActivePatients(result.data?.activePatients || []);
            setNursesOnDuty(result.data?.nursesOnDuty || []);
            setRecentHandovers(result.data?.recentHandovers || []);
            setIsVerified(result.data?.isVerified || false);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const handleVerify = async () => {
        if (verifyCode.length !== 4) {
            toast({ title: 'Error', description: 'Please enter 4-digit code', variant: 'destructive' });
            return;
        }
        setVerifying(true);
        try {
            const response = await fetch('/api/nursing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: CURRENT_NURSE.id, nurseName: CURRENT_NURSE.name, code: verifyCode }),
            });
            if (response.ok) {
                toast({ title: 'Verified', description: 'You can now log vitals and perform actions' });
                setIsVerified(true);
                setShowVerifyModal(false);
                setVerifyCode('');
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Verification failed', variant: 'destructive' }); }
        finally { setVerifying(false); }
    };

    const handleLogVitals = async () => {
        if (!selectedPatient) return;
        if (!isVerified) {
            toast({ title: 'Verification Required', description: 'Please verify with your daily code first', variant: 'destructive' });
            setShowVitalsModal(false);
            setShowVerifyModal(true);
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/nursing/vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedPatient.id,
                    patientId: selectedPatient.patient.id,
                    nurseId: CURRENT_NURSE.id,
                    nurseName: CURRENT_NURSE.name,
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
                    toast({ title: '⚠️ CRITICAL VALUES DETECTED', description: result.criticalValues.join(', ') + ' - Escalated to on-call doctor', variant: 'destructive' });
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

    const handleAssignNurse = async (nurseId: string, nurseName: string) => {
        if (!selectedPatient) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nurseId,
                    nurseName,
                    encounterId: selectedPatient.id,
                    patientId: selectedPatient.patient.id,
                    assignedBy: CURRENT_NURSE.name,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Assigned ${nurseName} to ${selectedPatient.patient.name}` });
                setShowAssignModal(false);
                fetchData();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to assign nurse', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    const handleHandover = async () => {
        if (!selectedPatient || !handover.incomingNurse) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing?action=handover', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedPatient.id,
                    outgoingNurse: CURRENT_NURSE.name,
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

    const handleSaveCarePlan = async () => {
        if (!selectedPatient) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing/care-plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedPatient.id,
                    patientId: selectedPatient.patient.id,
                    goals: carePlan.goals.split('\n').filter(g => g.trim()).map(g => ({ goal: g, status: 'active' })),
                    interventions: carePlan.interventions.split('\n').filter(i => i.trim()),
                    dailySchedule: carePlan.dailySchedule.split('\n').filter(s => s.trim()).map(s => {
                        const [time, ...task] = s.split(' - ');
                        return { time: time?.trim(), task: task.join(' - ')?.trim() };
                    }),
                    createdBy: CURRENT_NURSE.name,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Care plan saved' });
                setShowCarePlanModal(false);
                setCarePlan({ goals: '', interventions: '', dailySchedule: '' });
                fetchData();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to save care plan', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    const openVitals = (patient: ActivePatient) => { setSelectedPatient(patient); setShowVitalsModal(true); };
    const openAssign = (patient: ActivePatient) => { setSelectedPatient(patient); setShowAssignModal(true); };
    const openHandover = (patient: ActivePatient) => { setSelectedPatient(patient); setShowHandoverModal(true); };
    const openNotes = (patient: ActivePatient) => { setSelectedPatient(patient); setShowNotesModal(true); };
    const openCarePlan = (patient: ActivePatient) => {
        setSelectedPatient(patient);
        if (patient.carePlan) {
            const cp = patient.carePlan;
            setCarePlan({
                goals: cp.goals?.map((g: { goal: string }) => g.goal).join('\n') || '',
                interventions: '',
                dailySchedule: cp.interventions?.dailySchedule?.map((s: { time: string; task: string }) => `${s.time} - ${s.task}`).join('\n') || '',
            });
        }
        setShowCarePlanModal(true);
    };

    const getCurrentBed = (patient: ActivePatient) => patient.bedAssignments?.[0]?.bed;
    const getLatestVitals = (patient: ActivePatient) => patient.vitalSigns?.[0];

    // Stats
    const criticalCount = activePatients.filter(p => p.vitalSigns?.[0]?.isCritical).length;
    const myPatients = activePatients.filter(p => p.assignedNurse?.nurseId === CURRENT_NURSE.id);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Heart className="w-6 h-6 text-primary" />Nursing Station</h1>
                    <p className="text-sm text-muted-foreground mt-1">Welcome, {CURRENT_NURSE.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    {isVerified ? (
                        <span className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-sm font-medium"><ShieldCheck className="w-4 h-4" />Verified Today</span>
                    ) : (
                        <Button onClick={() => setShowVerifyModal(true)} className="flex items-center gap-2"><Lock className="w-4 h-4" />Enter Verification Code</Button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Users className="w-5 h-5 text-primary" /></div>
                    <div><p className="text-xs text-muted-foreground">My Patients</p><p className="text-lg font-bold">{myPatients.length}</p></div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center"><BedDouble className="w-5 h-5 text-status-info" /></div>
                    <div><p className="text-xs text-muted-foreground">Total Active</p><p className="text-lg font-bold">{activePatients.length}</p></div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center"><AlertTriangle className="w-5 h-5 text-status-critical" /></div>
                    <div><p className="text-xs text-muted-foreground">Critical</p><p className="text-lg font-bold">{criticalCount}</p></div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center"><Stethoscope className="w-5 h-5 text-status-success" /></div>
                    <div><p className="text-xs text-muted-foreground">Nurses On Duty</p><p className="text-lg font-bold">{nursesOnDuty.length}</p></div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center"><ArrowRightLeft className="w-5 h-5 text-status-warning" /></div>
                    <div><p className="text-xs text-muted-foreground">Handovers Today</p><p className="text-lg font-bold">{recentHandovers.length}</p></div>
                </div>
            </div>

            {/* Nurses On Duty */}
            <div className="floating-card">
                <h3 className="font-semibold mb-3 flex items-center gap-2"><Users className="w-4 h-4" />Nurses On Duty</h3>
                <div className="flex flex-wrap gap-2">
                    {nursesOnDuty.length === 0 ? (<p className="text-sm text-muted-foreground">No nurses checked in today</p>) :
                        nursesOnDuty.map(nurse => (
                            <div key={nurse.id} className={cn("px-3 py-2 rounded-lg border", nurse.nurseId === CURRENT_NURSE.id ? "bg-primary/10 border-primary" : "bg-muted/30")}>
                                <p className="font-medium text-sm">{nurse.nurseName}</p>
                                <p className="text-xs text-muted-foreground">{nurse.shiftType} • {nurse.assignmentCount || 0} patients</p>
                                {nurse.checkInAt && <p className="text-xs text-muted-foreground">In: {formatTime(nurse.checkInAt)}</p>}
                            </div>
                        ))}
                </div>
            </div>

            {/* Active Patients */}
            <div className="floating-card">
                <h3 className="font-semibold mb-4">Active Patients</h3>
                {loading ? (<div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>) :
                    activePatients.length === 0 ? (<p className="text-sm text-muted-foreground text-center py-8">No active patients</p>) : (
                        <div className="space-y-3">
                            {activePatients.map(patient => {
                                const bed = getCurrentBed(patient);
                                const latestVitals = getLatestVitals(patient);
                                const isMyPatient = patient.assignedNurse?.nurseId === CURRENT_NURSE.id;
                                return (
                                    <div key={patient.id} className={cn("p-4 rounded-xl border transition-all", isMyPatient ? "bg-primary/5 border-primary/30" : "bg-muted/30", latestVitals?.isCritical && "border-status-critical bg-status-critical/5")}>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg", isMyPatient ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground")}>{patient.patient.name.charAt(0)}</div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium">{patient.patient.name}</p>
                                                        <span className="text-xs text-muted-foreground">{patient.patient.uhid}</span>
                                                        {latestVitals?.isCritical && (<span className="px-2 py-0.5 text-xs bg-status-critical/10 text-status-critical rounded font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" />CRITICAL</span>)}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{getAge(patient.patient.dob)}y {patient.patient.gender.charAt(0)} • {patient.department || 'General'}</p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs">
                                                        {bed && (<span className="flex items-center gap-1 text-muted-foreground"><BedDouble className="w-3 h-3" />{bed.ward} - Bed {bed.bedNumber}</span>)}
                                                        {patient.assignedNurse && (<span className={cn("flex items-center gap-1", isMyPatient ? "text-primary font-medium" : "text-muted-foreground")}><Users className="w-3 h-3" />{patient.assignedNurse.nurseName}</span>)}
                                                    </div>
                                                    {patient.patient.allergies?.length > 0 && (<div className="flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3 text-status-critical" /><span className="text-xs text-status-critical">Allergies: {patient.patient.allergies.map(a => a.allergen).join(', ')}</span></div>)}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2 items-end">
                                                {latestVitals && (
                                                    <div className="text-right text-xs text-muted-foreground">
                                                        <p>Last vitals: {formatDateTime(latestVitals.recordedAt)}</p>
                                                        <p className="font-medium text-foreground">by {latestVitals.recordedBy}</p>
                                                    </div>
                                                )}
                                                <div className="flex gap-2 flex-wrap justify-end">
                                                    <Button size="sm" variant="outline" onClick={() => openNotes(patient)}><FileText className="w-4 h-4 mr-1" />Notes</Button>
                                                    <Button size="sm" variant="outline" onClick={() => openCarePlan(patient)}><ClipboardList className="w-4 h-4 mr-1" />Care Plan</Button>
                                                    <Button size="sm" variant="outline" onClick={() => openHandover(patient)}><ArrowRightLeft className="w-4 h-4 mr-1" />Handover</Button>
                                                    <Button size="sm" variant="outline" onClick={() => openAssign(patient)}><Users className="w-4 h-4 mr-1" />Assign</Button>
                                                    <Button size="sm" onClick={() => openVitals(patient)}><Activity className="w-4 h-4 mr-1" />Log Vitals</Button>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Latest Vitals Summary */}
                                        {latestVitals && (
                                            <div className="mt-3 pt-3 border-t grid grid-cols-6 gap-3 text-center">
                                                <div><p className="text-xs text-muted-foreground">Temp</p><p className={cn("font-medium", latestVitals.temperature && (latestVitals.temperature < 35 || latestVitals.temperature > 40) && "text-status-critical")}>{latestVitals.temperature || '-'}°C</p></div>
                                                <div><p className="text-xs text-muted-foreground">Pulse</p><p className={cn("font-medium", latestVitals.pulse && (latestVitals.pulse < 40 || latestVitals.pulse > 150) && "text-status-critical")}>{latestVitals.pulse || '-'}</p></div>
                                                <div><p className="text-xs text-muted-foreground">BP</p><p className={cn("font-medium", latestVitals.bpSystolic && (latestVitals.bpSystolic < 80 || latestVitals.bpSystolic > 200) && "text-status-critical")}>{latestVitals.bpSystolic || '-'}/{latestVitals.bpDiastolic || '-'}</p></div>
                                                <div><p className="text-xs text-muted-foreground">SpO2</p><p className={cn("font-medium", latestVitals.spO2 && latestVitals.spO2 < 90 && "text-status-critical")}>{latestVitals.spO2 || '-'}%</p></div>
                                                <div><p className="text-xs text-muted-foreground">Resp</p><p className={cn("font-medium", latestVitals.respRate && (latestVitals.respRate < 8 || latestVitals.respRate > 35) && "text-status-critical")}>{latestVitals.respRate || '-'}</p></div>
                                                <div><p className="text-xs text-muted-foreground">GCS</p><p className="font-medium">-</p></div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
            </div>

            {/* Recent Handovers */}
            {recentHandovers.length > 0 && (
                <div className="floating-card">
                    <h3 className="font-semibold mb-3 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" />Recent Handovers</h3>
                    <div className="space-y-2">
                        {recentHandovers.slice(0, 5).map(ho => (
                            <div key={ho.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                <div>
                                    <p className="text-sm font-medium">{ho.outgoingNurse} → {ho.incomingNurse}</p>
                                    <p className="text-xs text-muted-foreground">{ho.patientSummary?.substring(0, 50)}...</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-muted-foreground">{formatDateTime(ho.handoverAt)}</p>
                                    {ho.acknowledgedAt ? (<span className="text-xs text-green-600">Acknowledged</span>) : (<span className="text-xs text-yellow-600">Pending</span>)}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Verification Modal */}
            {showVerifyModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-sm w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold flex items-center gap-2"><Lock className="w-5 h-5" />Enter Verification Code</h2><Button variant="ghost" size="sm" onClick={() => setShowVerifyModal(false)}><X className="w-4 h-4" /></Button></div>
                        <p className="text-sm text-muted-foreground mb-4">Enter the 4-digit daily code provided by your administrator to verify your identity and enable vital logging.</p>
                        <Input type="text" placeholder="0000" maxLength={4} value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-widest font-mono" />
                        <Button className="w-full mt-4" onClick={handleVerify} disabled={verifying || verifyCode.length !== 4}>{verifying && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Verify</Button>
                    </div>
                </div>
            )}

            {/* Log Vitals Modal */}
            {showVitalsModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Log Vitals</h2><p className="text-sm text-muted-foreground">{selectedPatient.patient.name} ({selectedPatient.patient.uhid})</p></div><Button variant="ghost" size="sm" onClick={() => setShowVitalsModal(false)}><X className="w-4 h-4" /></Button></div>
                        {!isVerified && (<div className="p-3 mb-4 bg-status-warning/10 border border-status-warning/20 rounded-lg flex items-center gap-2"><Lock className="w-4 h-4 text-status-warning" /><span className="text-sm text-status-warning">Verification required before logging</span></div>)}
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Temperature (°C)</Label><Input type="number" step="0.1" placeholder="36.5" value={vitals.temperature} onChange={(e) => setVitals(v => ({ ...v, temperature: e.target.value }))} /></div>
                            <div><Label>Pulse (bpm)</Label><Input type="number" placeholder="72" value={vitals.pulse} onChange={(e) => setVitals(v => ({ ...v, pulse: e.target.value }))} /></div>
                            <div><Label>BP Systolic (mmHg)</Label><Input type="number" placeholder="120" value={vitals.bpSystolic} onChange={(e) => setVitals(v => ({ ...v, bpSystolic: e.target.value }))} /></div>
                            <div><Label>BP Diastolic (mmHg)</Label><Input type="number" placeholder="80" value={vitals.bpDiastolic} onChange={(e) => setVitals(v => ({ ...v, bpDiastolic: e.target.value }))} /></div>
                            <div><Label>SpO2 (%)</Label><Input type="number" placeholder="98" value={vitals.spO2} onChange={(e) => setVitals(v => ({ ...v, spO2: e.target.value }))} /></div>
                            <div><Label>Resp Rate (/min)</Label><Input type="number" placeholder="16" value={vitals.respRate} onChange={(e) => setVitals(v => ({ ...v, respRate: e.target.value }))} /></div>
                            <div><Label>Pain Score (0-10)</Label><Input type="number" min="0" max="10" placeholder="0" value={vitals.painScore} onChange={(e) => setVitals(v => ({ ...v, painScore: e.target.value }))} /></div>
                            <div className="col-span-2"><Label>Notes</Label><textarea className="w-full p-3 border rounded-lg min-h-[80px] resize-none" placeholder="Additional notes..." value={vitals.notes} onChange={(e) => setVitals(v => ({ ...v, notes: e.target.value }))} /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowVitalsModal(false)}>Cancel</Button><Button onClick={handleLogVitals} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Log Vitals</Button></div>
                    </div>
                </div>
            )}

            {/* Assign Nurse Modal */}
            {showAssignModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Assign Nurse</h2><p className="text-sm text-muted-foreground">{selectedPatient.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}><X className="w-4 h-4" /></Button></div>
                        <p className="text-sm text-muted-foreground mb-4">Select a nurse on duty to assign to this patient:</p>
                        <div className="space-y-2">{nursesOnDuty.length === 0 ? (<p className="text-center text-muted-foreground py-4">No nurses on duty</p>) : nursesOnDuty.map(nurse => (
                            <button key={nurse.id} onClick={() => handleAssignNurse(nurse.nurseId, nurse.nurseName)} className={cn("w-full p-3 rounded-lg border text-left flex items-center justify-between hover:bg-muted/50 transition-colors", selectedPatient.assignedNurse?.nurseId === nurse.nurseId && "bg-primary/10 border-primary")}>
                                <div><p className="font-medium">{nurse.nurseName}</p><p className="text-xs text-muted-foreground">{nurse.shiftType} shift • {nurse.assignmentCount || 0} patients</p></div>
                                {selectedPatient.assignedNurse?.nurseId === nurse.nurseId && <CheckCircle className="w-4 h-4 text-primary" />}
                            </button>
                        ))}</div>
                    </div>
                </div>
            )}

            {/* Doctor Notes Modal */}
            {showNotesModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5" />Doctor Notes</h2><p className="text-sm text-muted-foreground">{selectedPatient.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowNotesModal(false)}><X className="w-4 h-4" /></Button></div>
                        {selectedPatient.clinicalNotes?.length === 0 ? (<p className="text-center text-muted-foreground py-8">No doctor notes available</p>) : (
                            <div className="space-y-3">{selectedPatient.clinicalNotes?.map(note => (
                                <div key={note.id} className="p-3 border rounded-lg"><div className="flex items-center justify-between mb-2"><span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{note.noteType}</span><span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span></div><p className="text-sm">{note.content}</p><p className="text-xs text-muted-foreground mt-2">By {note.authorRole}</p></div>
                            ))}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Handover Modal */}
            {showHandoverModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Shift Handover</h2><p className="text-sm text-muted-foreground">{selectedPatient.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowHandoverModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-4">
                            <div><Label>Incoming Nurse</Label><select className="elegant-select" value={handover.incomingNurse} onChange={(e) => setHandover(h => ({ ...h, incomingNurse: e.target.value }))}><option value="">Select nurse...</option>{nursesOnDuty.filter(n => n.nurseId !== CURRENT_NURSE.id).map(n => (<option key={n.id} value={n.nurseName}>{n.nurseName} ({n.shiftType})</option>))}</select></div>
                            <div><Label>Patient Summary</Label><textarea className="w-full p-3 border rounded-lg min-h-[80px] resize-none" placeholder="Current condition, treatment summary..." value={handover.patientSummary} onChange={(e) => setHandover(h => ({ ...h, patientSummary: e.target.value }))} /></div>
                            <div><Label>Pending Tasks (one per line)</Label><textarea className="w-full p-3 border rounded-lg min-h-[60px] resize-none" placeholder="Medication at 10 PM&#10;Check BP in 2 hours" value={handover.pendingTasks} onChange={(e) => setHandover(h => ({ ...h, pendingTasks: e.target.value }))} /></div>
                            <div><Label>Alerts (one per line)</Label><textarea className="w-full p-3 border rounded-lg min-h-[60px] resize-none" placeholder="Watch for fever&#10;Patient is diabetic" value={handover.alerts} onChange={(e) => setHandover(h => ({ ...h, alerts: e.target.value }))} /></div>
                            <div><Label>Handover Notes</Label><textarea className="w-full p-3 border rounded-lg min-h-[60px] resize-none" placeholder="Additional notes for incoming nurse..." value={handover.handoverNotes} onChange={(e) => setHandover(h => ({ ...h, handoverNotes: e.target.value }))} /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowHandoverModal(false)}>Cancel</Button><Button onClick={handleHandover} disabled={saving || !handover.incomingNurse}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Handover</Button></div>
                    </div>
                </div>
            )}

            {/* Care Plan Modal */}
            {showCarePlanModal && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="w-5 h-5" />Care Plan</h2><p className="text-sm text-muted-foreground">{selectedPatient.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowCarePlanModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-4">
                            <div><Label>Goals (one per line)</Label><textarea className="w-full p-3 border rounded-lg min-h-[80px] resize-none" placeholder="Reduce pain to below 4/10&#10;Improve mobility&#10;Maintain blood sugar levels" value={carePlan.goals} onChange={(e) => setCarePlan(c => ({ ...c, goals: e.target.value }))} /></div>
                            <div><Label>Interventions</Label><textarea className="w-full p-3 border rounded-lg min-h-[80px] resize-none" placeholder="Administer medications as prescribed&#10;Provide wound care twice daily" value={carePlan.interventions} onChange={(e) => setCarePlan(c => ({ ...c, interventions: e.target.value }))} /></div>
                            <div><Label>Daily Schedule (format: TIME - Task)</Label><textarea className="w-full p-3 border rounded-lg min-h-[100px] resize-none" placeholder="06:00 - Morning vitals&#10;08:00 - Breakfast and medications&#10;10:00 - Physical therapy&#10;14:00 - Afternoon vitals" value={carePlan.dailySchedule} onChange={(e) => setCarePlan(c => ({ ...c, dailySchedule: e.target.value }))} /></div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowCarePlanModal(false)}>Cancel</Button><Button onClick={handleSaveCarePlan} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Care Plan</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
