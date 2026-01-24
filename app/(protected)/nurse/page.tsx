"use client";

import { useEffect, useState, useCallback } from 'react';
import { Heart, Activity, ThermometerSun, X, Loader2, RefreshCw, AlertTriangle, CheckCircle, Users, Lock, ShieldCheck, ClipboardList, Calendar, Key, UserPlus, FileText, Pill, Stethoscope } from 'lucide-react';
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
    bloodGroup: string | null;
    allergies: { allergen: string; severity: string }[];
}

interface ClinicalNote {
    id: string;
    noteType: string;
    content: string;
    authorRole: string;
    createdAt: string;
}

interface Prescription {
    id: string;
    createdAt: string;
    status: string;
    medications: {
        id: string;
        medicationName: string;
        dosage: string;
        frequency: string;
        route: string;
        duration: string | null;
        isDispensed: boolean;
    }[];
}

interface Encounter {
    id: string;
    type: string;
    status: string;
    department: string | null;
    patient: Patient;
    currentLocation: string | null;
    bedAssignments: { bed: { bedNumber: string; ward: string } }[];
    assignedNurse: { nurseId: string; nurseName: string } | null;
    clinicalNotes: ClinicalNote[];
    prescriptions: Prescription[];
    vitalSigns: VitalSign[];
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
}

interface NurseDuty {
    id: string;
    nurseId: string;
    nurseName: string;
    shiftType: string;
    checkInAt: string | null;
    ward: string | null;
    assignmentCount: number;
    secretCode: string | null;
    hasCode: boolean;
}

export default function NurseAdminPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [nursesOnDuty, setNursesOnDuty] = useState<NurseDuty[]>([]);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

    // Modals
    const [showVitalsModal, setShowVitalsModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showPrescriptionsModal, setShowPrescriptionsModal] = useState(false);
    const [showEMRModal, setShowEMRModal] = useState(false);

    // Vitals state
    const [vitals, setVitals] = useState({ temperature: '', pulse: '', respRate: '', bpSystolic: '', bpDiastolic: '', spO2: '', painScore: '', notes: '' });
    const [recentVitals, setRecentVitals] = useState<VitalSign[]>([]);

    // Verification state
    const [verifyCode, setVerifyCode] = useState('');
    const [selectedNurseForVitals, setSelectedNurseForVitals] = useState<string>('');
    const [isVerifiedForPatient, setIsVerifiedForPatient] = useState(false);

    const [saving, setSaving] = useState(false);
    const [generatingCode, setGeneratingCode] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const seedRes = await fetch('/api/nursing/seed');
            const seedData = await seedRes.json();
            if (seedData.nursesOnDuty === 0) {
                await fetch('/api/nursing/seed', { method: 'POST' });
            }

            const response = await fetch('/api/nursing');
            const result = await response.json();
            setEncounters(result.data?.activePatients || []);
            setNursesOnDuty(result.data?.nursesOnDuty || []);
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const fetchVitals = async (encounterId: string) => {
        try {
            const response = await fetch(`/api/vitals?encounterId=${encounterId}&limit=10`);
            const result = await response.json();
            setRecentVitals(result.data || []);
        } catch (error) {
            console.error('Failed to fetch vitals:', error);
        }
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    // Admin: Generate code for a nurse
    const handleGenerateCode = async (nurse: NurseDuty) => {
        setGeneratingCode(nurse.nurseId);
        try {
            const response = await fetch('/api/nursing?action=generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: nurse.nurseId, nurseName: nurse.nurseName }),
            });
            const result = await response.json();
            if (response.ok) {
                toast({ title: 'Code Generated', description: `Code for ${nurse.nurseName}: ${result.data.code}` });
                fetchData();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to generate code', variant: 'destructive' }); }
        finally { setGeneratingCode(null); }
    };

    // Admin: Assign nurse to patient
    const handleAssignNurse = async (nurse: NurseDuty) => {
        if (!selectedEncounter) return;
        setSaving(true);
        try {
            const response = await fetch('/api/nursing?action=assign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nurseId: nurse.nurseId,
                    nurseName: nurse.nurseName,
                    encounterId: selectedEncounter.id,
                    patientId: selectedEncounter.patient.id,
                }),
            });
            if (response.ok) {
                toast({ title: 'Assigned', description: `${nurse.nurseName} assigned to ${selectedEncounter.patient.name}` });
                setShowAssignModal(false);
                fetchData();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to assign', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    // Nurse: Verify code and record vitals
    const handleVerifyAndRecordVitals = async () => {
        if (!selectedEncounter || !selectedNurseForVitals) return;

        if (!isVerifiedForPatient) {
            if (verifyCode.length !== 4) {
                toast({ title: 'Error', description: 'Enter your 4-digit code', variant: 'destructive' });
                return;
            }

            setSaving(true);
            try {
                const response = await fetch('/api/nursing/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nurseId: selectedNurseForVitals,
                        code: verifyCode,
                        encounterId: selectedEncounter.id,
                    }),
                });
                const result = await response.json();
                if (response.ok && result.isVerified) {
                    setIsVerifiedForPatient(true);
                    toast({ title: 'Verified', description: 'You can now record vitals' });
                } else {
                    toast({ title: 'Error', description: result.error, variant: 'destructive' });
                }
            } catch { toast({ title: 'Error', description: 'Verification failed', variant: 'destructive' }); }
            finally { setSaving(false); }
            return;
        }

        setSaving(true);
        try {
            const nurse = nursesOnDuty.find(n => n.nurseId === selectedNurseForVitals);
            const response = await fetch('/api/vitals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedEncounter.id,
                    patientId: selectedEncounter.patient.id,
                    recordedBy: nurse?.nurseName || 'Unknown Nurse',
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
                setShowVitalsModal(false);
                setIsVerifiedForPatient(false);
                setVerifyCode('');
                fetchVitals(selectedEncounter.id);
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to record vitals', variant: 'destructive' }); }
        finally { setSaving(false); }
    };

    const openVitals = (encounter: Encounter) => {
        if (!encounter.assignedNurse) {
            toast({ title: 'No Nurse Assigned', description: 'Assign a nurse first', variant: 'destructive' });
            return;
        }
        setSelectedEncounter(encounter);
        setSelectedNurseForVitals(encounter.assignedNurse.nurseId);
        setIsVerifiedForPatient(false);
        setVerifyCode('');
        setShowVitalsModal(true);
        fetchVitals(encounter.id);
    };

    const openAssign = (encounter: Encounter) => { setSelectedEncounter(encounter); setShowAssignModal(true); };
    const openNotes = (encounter: Encounter) => { setSelectedEncounter(encounter); setShowNotesModal(true); };
    const openPrescriptions = (encounter: Encounter) => { setSelectedEncounter(encounter); setShowPrescriptionsModal(true); };
    const openEMR = (encounter: Encounter) => { setSelectedEncounter(encounter); setShowEMRModal(true); };

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
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Heart className="w-6 h-6 text-status-critical" />Nursing Admin Panel</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage nurse assignments, codes, and view patient records</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            {/* Nurses On Duty */}
            <div className="floating-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Users className="w-5 h-5" />Nurses On Duty - Generate Codes</h3>
                {nursesOnDuty.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No nurses on duty today</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {nursesOnDuty.map(nurse => (
                            <div key={nurse.id} className="p-4 rounded-xl border bg-muted/30">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <p className="font-medium">{nurse.nurseName}</p>
                                        <p className="text-xs text-muted-foreground">{nurse.shiftType} • {nurse.ward}</p>
                                    </div>
                                    {nurse.hasCode && <ShieldCheck className="w-4 h-4 text-green-500" />}
                                </div>
                                <p className="text-xs text-muted-foreground mb-2">{nurse.assignmentCount} patients assigned</p>
                                {nurse.secretCode ? (
                                    <div className="p-2 bg-primary/10 rounded-lg mb-2">
                                        <p className="text-xs text-muted-foreground">Current Code:</p>
                                        <p className="text-xl font-mono font-bold tracking-widest text-primary">{nurse.secretCode}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-2">No code generated</p>
                                )}
                                <Button size="sm" className="w-full" onClick={() => handleGenerateCode(nurse)} disabled={generatingCode === nurse.nurseId}>
                                    {generatingCode === nurse.nurseId ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Key className="w-4 h-4 mr-2" />}
                                    {nurse.secretCode ? 'Regenerate Code' : 'Generate Code'}
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Patient List */}
            <div className="floating-card">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5" />Active Patients ({encounters.length})</h3>
                {loading ? (
                    <div className="flex items-center justify-center h-32"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : encounters.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No admitted patients</p>
                ) : (
                    <div className="grid gap-4">
                        {encounters.map((encounter) => (
                            <div key={encounter.id} className="p-4 rounded-xl border bg-muted/30">
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{encounter.patient.name.charAt(0)}</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">{encounter.patient.name}</p>
                                                <span className="text-xs text-muted-foreground">{encounter.patient.uhid}</span>
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                Bed: {encounter.bedAssignments[0]?.bed.bedNumber || 'N/A'} • {encounter.bedAssignments[0]?.bed.ward || ''} • {encounter.department || 'General'}
                                            </p>
                                            {encounter.patient.allergies?.length > 0 && (
                                                <div className="flex items-center gap-1 mt-1">
                                                    <AlertTriangle className="w-3 h-3 text-status-critical" />
                                                    <span className="text-xs text-status-critical">Allergies: {encounter.patient.allergies.map(a => a.allergen).join(', ')}</span>
                                                </div>
                                            )}
                                            <div className="mt-2">
                                                {encounter.assignedNurse ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                                                        <CheckCircle className="w-3 h-3" />Assigned: {encounter.assignedNurse.nurseName}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-medium">
                                                        <AlertTriangle className="w-3 h-3" />No nurse assigned
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button size="sm" variant="outline" onClick={() => openNotes(encounter)}><FileText className="w-4 h-4 mr-1" />Notes</Button>
                                        <Button size="sm" variant="outline" onClick={() => openPrescriptions(encounter)}><Pill className="w-4 h-4 mr-1" />Prescriptions</Button>
                                        <Button size="sm" variant="outline" onClick={() => openEMR(encounter)}><Stethoscope className="w-4 h-4 mr-1" />EMR</Button>
                                        <Button size="sm" variant="outline" onClick={() => openAssign(encounter)}><UserPlus className="w-4 h-4 mr-1" />Assign</Button>
                                        <Button size="sm" onClick={() => openVitals(encounter)} disabled={!encounter.assignedNurse}><ThermometerSun className="w-4 h-4 mr-1" />Vitals</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Doctor Notes Modal */}
            {showNotesModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5" />Doctor Notes</h2>
                                <p className="text-sm text-muted-foreground">{selectedEncounter.patient.name} ({selectedEncounter.patient.uhid})</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowNotesModal(false)}><X className="w-4 h-4" /></Button>
                        </div>

                        {selectedEncounter.clinicalNotes?.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No doctor notes available</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedEncounter.clinicalNotes?.map(note => (
                                    <div key={note.id} className="p-4 border rounded-xl bg-muted/30">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded font-medium">{note.noteType.replace('-', ' ').toUpperCase()}</span>
                                            <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                                        </div>
                                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                        <p className="text-xs text-muted-foreground mt-2">By {note.authorRole}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Prescriptions Modal */}
            {showPrescriptionsModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2"><Pill className="w-5 h-5" />Prescriptions</h2>
                                <p className="text-sm text-muted-foreground">{selectedEncounter.patient.name} ({selectedEncounter.patient.uhid})</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowPrescriptionsModal(false)}><X className="w-4 h-4" /></Button>
                        </div>

                        {selectedEncounter.prescriptions?.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No prescriptions available</p>
                        ) : (
                            <div className="space-y-4">
                                {selectedEncounter.prescriptions?.map(prescription => (
                                    <div key={prescription.id} className="p-4 border rounded-xl bg-muted/30">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className={cn("text-xs px-2 py-1 rounded font-medium", prescription.status === 'active' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-gray-100 text-gray-700")}>
                                                {prescription.status.toUpperCase()}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{formatDateTime(prescription.createdAt)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {prescription.medications?.map(med => (
                                                <div key={med.id} className="flex items-center justify-between p-2 bg-background rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-sm">{med.medicationName}</p>
                                                        <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency} • {med.route}</p>
                                                        {med.duration && <p className="text-xs text-muted-foreground">Duration: {med.duration}</p>}
                                                    </div>
                                                    {med.isDispensed ? (
                                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded">Dispensed</span>
                                                    ) : (
                                                        <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded">Pending</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* EMR Modal */}
            {showEMRModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2"><Stethoscope className="w-5 h-5" />Electronic Medical Record</h2>
                                <p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowEMRModal(false)}><X className="w-4 h-4" /></Button>
                        </div>

                        {/* Patient Info */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl mb-4">
                            <div><p className="text-xs text-muted-foreground">UHID</p><p className="font-medium">{selectedEncounter.patient.uhid}</p></div>
                            <div><p className="text-xs text-muted-foreground">Age / Gender</p><p className="font-medium">{getAge(selectedEncounter.patient.dob)}y / {selectedEncounter.patient.gender}</p></div>
                            <div><p className="text-xs text-muted-foreground">Blood Group</p><p className="font-medium">{selectedEncounter.patient.bloodGroup || 'Unknown'}</p></div>
                            <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{selectedEncounter.department || 'General'}</p></div>
                        </div>

                        {/* Allergies */}
                        {selectedEncounter.patient.allergies?.length > 0 && (
                            <div className="p-3 mb-4 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Allergies</p>
                                <p className="text-sm text-red-600 dark:text-red-400">{selectedEncounter.patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ')}</p>
                            </div>
                        )}

                        {/* Latest Vitals */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Activity className="w-4 h-4" />Latest Vitals</h3>
                            {selectedEncounter.vitalSigns?.length > 0 ? (
                                <div className="grid grid-cols-6 gap-3 p-4 bg-muted/30 rounded-xl text-center">
                                    <div><p className="text-xs text-muted-foreground">Temp</p><p className="font-medium">{selectedEncounter.vitalSigns[0]?.temperature || '-'}°C</p></div>
                                    <div><p className="text-xs text-muted-foreground">Pulse</p><p className="font-medium">{selectedEncounter.vitalSigns[0]?.pulse || '-'} bpm</p></div>
                                    <div><p className="text-xs text-muted-foreground">BP</p><p className="font-medium">{selectedEncounter.vitalSigns[0]?.bpSystolic || '-'}/{selectedEncounter.vitalSigns[0]?.bpDiastolic || '-'}</p></div>
                                    <div><p className="text-xs text-muted-foreground">SpO2</p><p className="font-medium">{selectedEncounter.vitalSigns[0]?.spO2 || '-'}%</p></div>
                                    <div><p className="text-xs text-muted-foreground">Resp</p><p className="font-medium">{selectedEncounter.vitalSigns[0]?.respRate || '-'}/min</p></div>
                                    <div><p className="text-xs text-muted-foreground">Recorded</p><p className="text-xs">{selectedEncounter.vitalSigns[0]?.recordedAt ? formatDateTime(selectedEncounter.vitalSigns[0].recordedAt) : '-'}</p></div>
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">No vitals recorded</p>
                            )}
                        </div>

                        {/* Recent Notes */}
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" />Recent Doctor Notes</h3>
                            {selectedEncounter.clinicalNotes?.length > 0 ? (
                                <div className="space-y-2">
                                    {selectedEncounter.clinicalNotes.slice(0, 3).map(note => (
                                        <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs font-medium text-primary">{note.noteType.replace('-', ' ')}</span>
                                                <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                                            </div>
                                            <p className="text-sm line-clamp-2">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">No notes available</p>
                            )}
                        </div>

                        {/* Active Medications */}
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Pill className="w-4 h-4" />Active Medications</h3>
                            {selectedEncounter.prescriptions?.filter(p => p.status === 'active').flatMap(p => p.medications).length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedEncounter.prescriptions.filter(p => p.status === 'active').flatMap(p => p.medications).map(med => (
                                        <div key={med.id} className="p-3 bg-muted/30 rounded-lg">
                                            <p className="font-medium text-sm">{med.medicationName}</p>
                                            <p className="text-xs text-muted-foreground">{med.dosage} • {med.frequency}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">No active medications</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Nurse Modal */}
            {showAssignModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">Assign Nurse to Patient</h2>
                                <p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(false)}><X className="w-4 h-4" /></Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">Select a nurse to assign:</p>
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            {nursesOnDuty.filter(n => n.hasCode).length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">No nurses have codes. Generate codes first.</p>
                            ) : (
                                nursesOnDuty.filter(n => n.hasCode).map(nurse => (
                                    <button key={nurse.id} onClick={() => handleAssignNurse(nurse)} disabled={saving}
                                        className={cn("w-full p-3 rounded-lg border text-left flex items-center justify-between hover:bg-muted/50 transition-colors",
                                            selectedEncounter.assignedNurse?.nurseId === nurse.nurseId && "bg-primary/10 border-primary")}>
                                        <div>
                                            <p className="font-medium">{nurse.nurseName}</p>
                                            <p className="text-xs text-muted-foreground">{nurse.shiftType} • {nurse.assignmentCount} patients</p>
                                        </div>
                                        {selectedEncounter.assignedNurse?.nurseId === nurse.nurseId && <CheckCircle className="w-4 h-4 text-primary" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Vitals Modal */}
            {showVitalsModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">Record Vitals</h2>
                                <p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p>
                                <p className="text-xs text-muted-foreground">Assigned: {selectedEncounter.assignedNurse?.nurseName}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setShowVitalsModal(false); setIsVerifiedForPatient(false); setVerifyCode(''); }}><X className="w-4 h-4" /></Button>
                        </div>

                        {!isVerifiedForPatient ? (
                            <div className="p-6 bg-muted/30 rounded-xl mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <Lock className="w-6 h-6 text-primary" />
                                    <div>
                                        <h3 className="font-semibold">Nurse Verification Required</h3>
                                        <p className="text-sm text-muted-foreground">Enter your unique 4-digit code</p>
                                    </div>
                                </div>
                                <Input type="text" placeholder="0000" maxLength={4} value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))} className="text-center text-3xl tracking-widest font-mono h-16 mb-4" />
                                <Button className="w-full" onClick={handleVerifyAndRecordVitals} disabled={saving || verifyCode.length !== 4}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Verify Code
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="p-3 mb-4 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-green-600" />
                                    <span className="text-sm font-medium text-green-700 dark:text-green-300">Verified - Recording as {selectedEncounter.assignedNurse?.nurseName}</span>
                                </div>
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
                                <Button className="w-full mb-6" onClick={handleVerifyAndRecordVitals} disabled={saving}>
                                    {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Record Vitals
                                </Button>
                            </>
                        )}

                        {recentVitals.length > 0 && (
                            <div>
                                <h3 className="font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Recent Readings</h3>
                                <div className="space-y-2">
                                    {recentVitals.map((v) => (
                                        <div key={v.id} className="p-3 bg-muted/30 rounded-lg">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="font-medium text-primary">{formatDateTime(v.recordedAt)}</span>
                                                <span className="text-xs text-muted-foreground">by {v.recordedBy}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>T: {v.temperature || '-'}°C</span>
                                                <span>P: {v.pulse || '-'}</span>
                                                <span>R: {v.respRate || '-'}</span>
                                                <span>BP: {v.bpSystolic || '-'}/{v.bpDiastolic || '-'}</span>
                                                <span>SpO2: {v.spO2 || '-'}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
