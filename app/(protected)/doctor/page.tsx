"use client";

import { useEffect, useState } from 'react';
import { Stethoscope, UserPlus, Pill, FlaskConical, FileText, Plus, X, Loader2, Search, AlertTriangle } from 'lucide-react';
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

interface Encounter {
    id: string;
    type: string;
    status: string;
    patient: Patient;
    department: string | null;
}

interface Medication {
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
}

export default function DoctorPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showLabOrderModal, setShowLabOrderModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [medications, setMedications] = useState<Medication[]>([{ medicationName: '', dosage: '', frequency: '', route: 'oral', duration: '', instructions: '' }]);
    const [labOrders, setLabOrders] = useState<{ orderCode: string; orderName: string; priority: string }[]>([]);
    const [note, setNote] = useState({ noteType: 'progress', content: '' });
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    const fetchEncounters = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/encounters?status=ACTIVE');
            const result = await response.json();
            setEncounters(result.data || []);
        } catch (error) {
            console.error('Failed to fetch encounters:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchEncounters(); }, []);

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const addMedication = () => {
        setMedications([...medications, { medicationName: '', dosage: '', frequency: '', route: 'oral', duration: '', instructions: '' }]);
    };

    const removeMedication = (index: number) => {
        setMedications(medications.filter((_, i) => i !== index));
    };

    const updateMedication = (index: number, field: keyof Medication, value: string) => {
        const updated = [...medications];
        updated[index][field] = value;
        setMedications(updated);
    };

    const handlePrescribe = async () => {
        if (!selectedEncounter) return;
        const validMeds = medications.filter(m => m.medicationName && m.dosage && m.frequency);
        if (validMeds.length === 0) {
            toast({ title: 'Error', description: 'Add at least one medication', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch('/api/pharmacy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedEncounter.id,
                    patientId: selectedEncounter.patient.id,
                    prescribedBy: 'Doctor',
                    medications: validMeds,
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Prescription created' });
                setShowPrescriptionModal(false);
                setMedications([{ medicationName: '', dosage: '', frequency: '', route: 'oral', duration: '', instructions: '' }]);
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create prescription', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleLabOrder = async () => {
        if (!selectedEncounter || labOrders.length === 0) return;
        setSaving(true);
        try {
            for (const order of labOrders) {
                await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        encounterId: selectedEncounter.id,
                        patientId: selectedEncounter.patient.id,
                        orderType: 'lab',
                        orderCode: order.orderCode,
                        orderName: order.orderName,
                        priority: order.priority,
                        orderedBy: 'Doctor',
                    }),
                });
            }
            toast({ title: 'Success', description: `${labOrders.length} lab orders created` });
            setShowLabOrderModal(false);
            setLabOrders([]);
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to create orders', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddNote = async () => {
        if (!selectedEncounter || !note.content) return;
        setSaving(true);
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    encounterId: selectedEncounter.id,
                    patientId: selectedEncounter.patient.id,
                    noteType: note.noteType,
                    content: note.content,
                    authorId: 'doctor-1',
                    authorRole: 'Doctor',
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Note added' });
                setShowNoteModal(false);
                setNote({ noteType: 'progress', content: '' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const commonLabTests = [
        { orderCode: 'CBC', orderName: 'Complete Blood Count' },
        { orderCode: 'LFT', orderName: 'Liver Function Test' },
        { orderCode: 'KFT', orderName: 'Kidney Function Test' },
        { orderCode: 'LIPID', orderName: 'Lipid Profile' },
        { orderCode: 'TFT', orderName: 'Thyroid Function Test' },
        { orderCode: 'HbA1c', orderName: 'Glycated Hemoglobin' },
        { orderCode: 'TROP', orderName: 'Troponin' },
        { orderCode: 'ECG', orderName: 'Electrocardiogram' },
    ];

    const toggleLabOrder = (test: { orderCode: string; orderName: string }) => {
        const exists = labOrders.find(o => o.orderCode === test.orderCode);
        if (exists) {
            setLabOrders(labOrders.filter(o => o.orderCode !== test.orderCode));
        } else {
            setLabOrders([...labOrders, { ...test, priority: 'ROUTINE' }]);
        }
    };

    const filteredEncounters = encounters.filter(e =>
        e.patient.name.toLowerCase().includes(search.toLowerCase()) ||
        e.patient.uhid.toLowerCase().includes(search.toLowerCase())
    );

    const openForPatient = (encounter: Encounter, modal: 'prescription' | 'lab' | 'note') => {
        setSelectedEncounter(encounter);
        if (modal === 'prescription') setShowPrescriptionModal(true);
        if (modal === 'lab') setShowLabOrderModal(true);
        if (modal === 'note') setShowNoteModal(true);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Stethoscope className="w-6 h-6 text-primary" />
                        Doctor Workstation
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{encounters.length} active patients</p>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search patients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : filteredEncounters.length === 0 ? (
                <div className="floating-card text-center py-12"><UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No active patients</p></div>
            ) : (
                <div className="grid gap-4">
                    {filteredEncounters.map((encounter) => (
                        <div key={encounter.id} className="floating-card">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">{encounter.patient.name.charAt(0)}</div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium">{encounter.patient.name}</p>
                                            <span className="text-xs text-muted-foreground">{encounter.patient.uhid}</span>
                                            <span className={cn("px-2 py-0.5 text-xs rounded", encounter.type === 'EMERGENCY' ? 'bg-status-critical/10 text-status-critical' : encounter.type === 'IPD' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700')}>{encounter.type}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{getAge(encounter.patient.dob)}y {encounter.patient.gender.charAt(0)} • {encounter.department || 'General'}</p>
                                        {encounter.patient.allergies?.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1"><AlertTriangle className="w-3 h-3 text-status-critical" /><span className="text-xs text-status-critical">Allergies: {encounter.patient.allergies.map(a => a.allergen).join(', ')}</span></div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => openForPatient(encounter, 'note')}><FileText className="w-4 h-4 mr-1" />Add Note</Button>
                                    <Button size="sm" variant="outline" onClick={() => openForPatient(encounter, 'lab')}><FlaskConical className="w-4 h-4 mr-1" />Order Lab</Button>
                                    <Button size="sm" onClick={() => openForPatient(encounter, 'prescription')}><Pill className="w-4 h-4 mr-1" />Prescribe</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Prescription Modal */}
            {showPrescriptionModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Write Prescription</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name} ({selectedEncounter.patient.uhid})</p></div><Button variant="ghost" size="sm" onClick={() => setShowPrescriptionModal(false)}><X className="w-4 h-4" /></Button></div>
                        {selectedEncounter.patient.allergies?.length > 0 && (<div className="bg-status-critical/10 border border-status-critical/20 rounded-lg p-3 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-status-critical" /><span className="text-sm text-status-critical font-medium">Known Allergies: {selectedEncounter.patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ')}</span></div>)}
                        <div className="space-y-4">
                            {medications.map((med, index) => (
                                <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between"><span className="text-sm font-medium">Medication {index + 1}</span>{medications.length > 1 && (<Button variant="ghost" size="sm" onClick={() => removeMedication(index)}><X className="w-4 h-4" /></Button>)}</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2"><Label>Medication Name</Label><Input placeholder="e.g. Paracetamol 500mg" value={med.medicationName} onChange={(e) => updateMedication(index, 'medicationName', e.target.value)} /></div>
                                        <div><Label>Dosage</Label><Input placeholder="e.g. 1 tablet" value={med.dosage} onChange={(e) => updateMedication(index, 'dosage', e.target.value)} /></div>
                                        <div><Label>Frequency</Label><select className="elegant-select" value={med.frequency} onChange={(e) => updateMedication(index, 'frequency', e.target.value)}><option value="">Select</option><option value="OD">Once daily (OD)</option><option value="BD">Twice daily (BD)</option><option value="TDS">Three times (TDS)</option><option value="QID">Four times (QID)</option><option value="SOS">As needed (SOS)</option><option value="STAT">Immediately (STAT)</option></select></div>
                                        <div><Label>Route</Label><select className="elegant-select" value={med.route} onChange={(e) => updateMedication(index, 'route', e.target.value)}><option value="oral">Oral</option><option value="iv">IV</option><option value="im">IM</option><option value="sc">Subcutaneous</option><option value="topical">Topical</option><option value="inhalation">Inhalation</option></select></div>
                                        <div><Label>Duration</Label><Input placeholder="e.g. 5 days" value={med.duration} onChange={(e) => updateMedication(index, 'duration', e.target.value)} /></div>
                                        <div className="col-span-2"><Label>Instructions</Label><Input placeholder="e.g. After food" value={med.instructions} onChange={(e) => updateMedication(index, 'instructions', e.target.value)} /></div>
                                    </div>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full" onClick={addMedication}><Plus className="w-4 h-4 mr-2" />Add Another Medication</Button>
                        </div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowPrescriptionModal(false)}>Cancel</Button><Button onClick={handlePrescribe} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Create Prescription</Button></div>
                    </div>
                </div>
            )}

            {/* Lab Order Modal */}
            {showLabOrderModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Order Lab Tests</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowLabOrderModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="grid grid-cols-2 gap-2 mb-4">{commonLabTests.map((test) => (<button key={test.orderCode} onClick={() => toggleLabOrder(test)} className={cn("p-3 rounded-lg border text-left transition-all", labOrders.find(o => o.orderCode === test.orderCode) ? "bg-primary/10 border-primary" : "hover:bg-muted/50")}><p className="font-medium text-sm">{test.orderName}</p><p className="text-xs text-muted-foreground">{test.orderCode}</p></button>))}</div>
                        {labOrders.length > 0 && (<div className="mb-4 p-3 bg-muted/30 rounded-lg"><p className="text-sm font-medium mb-2">Selected: {labOrders.length} tests</p><div className="flex flex-wrap gap-1">{labOrders.map(o => (<span key={o.orderCode} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{o.orderCode}</span>))}</div></div>)}
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowLabOrderModal(false)}>Cancel</Button><Button onClick={handleLabOrder} disabled={saving || labOrders.length === 0}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Order {labOrders.length} Tests</Button></div>
                    </div>
                </div>
            )}

            {/* Add Note Modal */}
            {showNoteModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Add Clinical Note</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowNoteModal(false)}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-4"><div><Label>Note Type</Label><select className="elegant-select" value={note.noteType} onChange={(e) => setNote(n => ({ ...n, noteType: e.target.value }))}><option value="chief-complaint">Chief Complaint</option><option value="history">History</option><option value="progress">Progress Note</option><option value="discharge">Discharge Note</option></select></div><div><Label>Content</Label><textarea className="w-full p-3 border rounded-lg min-h-[150px] resize-none" placeholder="Enter clinical notes..." value={note.content} onChange={(e) => setNote(n => ({ ...n, content: e.target.value }))} /></div></div>
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setShowNoteModal(false)}>Cancel</Button><Button onClick={handleAddNote} disabled={saving || !note.content}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Note</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
