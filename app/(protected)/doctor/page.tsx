"use client";

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Stethoscope, UserPlus, Pill, FlaskConical, FileText, Plus, X, Loader2, Search, AlertTriangle, Clock, BedDouble, Calendar, ClipboardList, Eye, Upload, Image as ImageIcon, CalendarDays, Filter, ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, FileImage, Download } from 'lucide-react';
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
    contact?: string;
    allergies: { allergen: string; severity: string }[];
}

interface BedInfo {
    id: string;
    bedNumber: string;
    ward: string;
    type: string;
}

interface Encounter {
    id: string;
    type: 'OPD' | 'IPD' | 'EMERGENCY';
    status: string;
    patient: Patient;
    department: string | null;
    arrivalTime: string;
    admissionTime: string;
    updatedAt: string;
    bedAssignments: { bed: BedInfo }[];
}

interface Medication {
    medicationName: string;
    dosage: string;
    frequency: string;
    route: string;
    duration: string;
    instructions: string;
}

interface MedicationOption {
    id: string;
    name: string;
    genericName?: string;
    form?: string;
    strength?: string;
}

interface Appointment {
    id: string;
    patientId: string;
    department: string;
    scheduledAt: string;
    duration: number;
    status: string;
    visitType: string;
    notes: string | null;
    patient: {
        id: string;
        uhid: string;
        name: string;
        gender: string;
        dob: string;
    };
}

interface LabResultData {
    resultedAt: string;
    isCritical: boolean;
    result: Record<string, unknown>;
    interpretation: string | null;
    normalRange?: string | null;
}

interface RadiologyResultData {
    performedAt: string;
    findings: string;
    impression: string;
    imageUrls: string[];
    reportUrl: string | null;
}

interface EMRData {
    patient: {
        id: string;
        uhid: string;
        name: string;
        dob: string;
        gender: string;
        bloodGroup: string | null;
        allergies: { allergen: string; severity: string }[];
    };
    clinicalNotes: {
        id: string;
        noteType: string;
        content: string;
        authorRole: string;
        createdAt: string;
        encounterType: string;
    }[];
    prescriptions: {
        id: string;
        prescribedBy: string;
        prescribedAt: string;
        status: string;
        prescriptionImageUrl: string | null;
        medications: {
            medicationName: string;
            dosage: string;
            frequency: string;
            duration: string;
        }[];
        encounterType: string;
    }[];
    labResults: {
        orderId: string;
        orderCode: string;
        orderName: string;
        orderedAt: string;
        status: string;
        result: LabResultData | null;
    }[];
    radiologyResults: {
        orderId: string;
        orderCode: string;
        orderName: string;
        orderedAt: string;
        status: string;
        result: RadiologyResultData | null;
    }[];
}

export default function DoctorPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
    const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
    const [showLabOrderModal, setShowLabOrderModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showEMRDrawer, setShowEMRDrawer] = useState(false);
    const [showLabResultsModal, setShowLabResultsModal] = useState(false);
    const [showAppointmentsPanel, setShowAppointmentsPanel] = useState(false);
    const [emrData, setEmrData] = useState<EMRData | null>(null);
    const [emrLoading, setEmrLoading] = useState(false);
    const [medications, setMedications] = useState<Medication[]>([{ medicationName: '', dosage: '', frequency: '', route: 'oral', duration: '', instructions: '' }]);
    const [prescriptionImage, setPrescriptionImage] = useState<string | null>(null);
    const [prescriptionOcrText, setPrescriptionOcrText] = useState('');
    const [ocrLoading, setOcrLoading] = useState(false);
    const [noteImage, setNoteImage] = useState<string | null>(null);
    const [noteOcrText, setNoteOcrText] = useState('');
    const [labOrders, setLabOrders] = useState<{ orderCode: string; orderName: string; priority: string }[]>([]);
    const [note, setNote] = useState({ noteType: 'progress', content: '' });
    const [saving, setSaving] = useState(false);

    // Search, Filter, Sort state
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'time' | 'type'>('time');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [showFilters, setShowFilters] = useState(false);

    // Appointments state - day-wise
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [appointmentsLoading, setAppointmentsLoading] = useState(false);
    const [selectedWeekStart, setSelectedWeekStart] = useState<Date>(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Start from Monday
        return new Date(today.setDate(diff));
    });

    // Medication suggestions
    const [medicationSuggestions, setMedicationSuggestions] = useState<MedicationOption[]>([]);
    const [activeMedIndex, setActiveMedIndex] = useState<number | null>(null);
    const [medSearchLoading, setMedSearchLoading] = useState(false);

    // Lab report tab
    const [labReportTab, setLabReportTab] = useState<'lab' | 'radiology'>('lab');

    // Selected day for appointment detail view
    const [selectedDayForAppointments, setSelectedDayForAppointments] = useState<Date | null>(null);

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

    const fetchAppointments = async () => {
        setAppointmentsLoading(true);
        try {
            const response = await fetch('/api/doctor/appointments');
            const result = await response.json();
            setAppointments(result.appointments || []);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setAppointmentsLoading(false);
        }
    };

    const fetchMedications = useCallback(async (query: string) => {
        if (query.length < 2) {
            setMedicationSuggestions([]);
            return;
        }
        setMedSearchLoading(true);
        try {
            const response = await fetch(`/api/doctor/medications?q=${encodeURIComponent(query)}`);
            const result = await response.json();
            const meds = [
                ...(result.medications || []).map((m: MedicationOption) => ({
                    id: m.id,
                    name: `${m.name} ${m.strength || ''} (${m.form || ''})`.trim(),
                    genericName: m.genericName,
                })),
                ...(result.inventoryMeds || []).map((m: { id: string; name: string }) => ({
                    id: m.id,
                    name: m.name,
                })),
            ];
            setMedicationSuggestions(meds);
        } catch (error) {
            console.error('Failed to fetch medications:', error);
        } finally {
            setMedSearchLoading(false);
        }
    }, []);

    const fetchEMR = async (patientId: string) => {
        setEmrLoading(true);
        try {
            const response = await fetch(`/api/doctor/patients/${patientId}/emr`);
            const result = await response.json();
            setEmrData(result.data);
        } catch (error) {
            console.error('Failed to fetch EMR:', error);
            toast({ title: 'Error', description: 'Failed to load patient records', variant: 'destructive' });
        } finally {
            setEmrLoading(false);
        }
    };

    useEffect(() => { fetchAppointments(); }, []);

    // Get week days
    const getWeekDays = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(selectedWeekStart);
            day.setDate(day.getDate() + i);
            days.push(day);
        }
        return days;
    };

    const weekDays = getWeekDays();

    const getAppointmentsForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return appointments.filter(apt => {
            const aptDate = new Date(apt.scheduledAt).toISOString().split('T')[0];
            return aptDate === dateStr;
        });
    };

    const navigateWeek = (direction: 'prev' | 'next') => {
        const newStart = new Date(selectedWeekStart);
        newStart.setDate(newStart.getDate() + (direction === 'next' ? 7 : -7));
        setSelectedWeekStart(newStart);
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const formatDateTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr: string | Date) => {
        const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDayName = (date: Date) => {
        return date.toLocaleDateString('en-IN', { weekday: 'short' });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    };

    const getTimeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'Just now';
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
        if (field === 'medicationName') {
            setActiveMedIndex(index);
            fetchMedications(value);
        }
    };

    const selectMedication = (index: number, med: MedicationOption) => {
        const updated = [...medications];
        updated[index].medicationName = med.name;
        setMedications(updated);
        setMedicationSuggestions([]);
        setActiveMedIndex(null);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
                return;
            }
            const reader = new FileReader();
            reader.onload = async () => {
                const imageData = reader.result as string;
                setPrescriptionImage(imageData);
                // Trigger OCR extraction via Python API
                setOcrLoading(true);
                setPrescriptionOcrText('');
                try {
                    const response = await fetch('/api/ocr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData }),
                    });
                    const result = await response.json();
                    if (result.success) {
                        setPrescriptionOcrText(result.text || '');
                    } else {
                        console.error('OCR failed:', result.error);
                        toast({ title: 'OCR Error', description: result.error || 'Could not extract text', variant: 'destructive' });
                    }
                } catch (err) {
                    console.error('OCR extraction failed:', err);
                    toast({ title: 'OCR Error', description: 'Could not extract text from image', variant: 'destructive' });
                } finally {
                    setOcrLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNoteImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
                return;
            }
            const reader = new FileReader();
            reader.onload = async () => {
                const imageData = reader.result as string;
                setNoteImage(imageData);
                // Trigger OCR extraction via Python API
                setOcrLoading(true);
                setNoteOcrText('');
                try {
                    const response = await fetch('/api/ocr', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image: imageData }),
                    });
                    const result = await response.json();
                    if (result.success) {
                        setNoteOcrText(result.text || '');
                    } else {
                        console.error('OCR failed:', result.error);
                        toast({ title: 'OCR Error', description: result.error || 'Could not extract text', variant: 'destructive' });
                    }
                } catch (err) {
                    console.error('OCR extraction failed:', err);
                    toast({ title: 'OCR Error', description: 'Could not extract text from image', variant: 'destructive' });
                } finally {
                    setOcrLoading(false);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePrescribe = async () => {
        if (!selectedEncounter) return;
        const validMeds = medications.filter(m => m.medicationName && m.dosage && m.frequency);
        if (validMeds.length === 0 && !prescriptionImage) {
            toast({ title: 'Error', description: 'Add at least one medication or upload a prescription image', variant: 'destructive' });
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
                    prescriptionImageUrl: prescriptionImage || null,
                    medications: validMeds.length > 0 ? validMeds : [{ medicationName: 'See attached image', dosage: '-', frequency: '-', route: '-', duration: '-' }],
                }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Prescription created' });
                setShowPrescriptionModal(false);
                setMedications([{ medicationName: '', dosage: '', frequency: '', route: 'oral', duration: '', instructions: '' }]);
                setPrescriptionImage(null);
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch { toast({ title: 'Error', description: 'Failed to create prescription', variant: 'destructive' }); } finally { setSaving(false); }
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
        } catch { toast({ title: 'Error', description: 'Failed to create orders', variant: 'destructive' }); } finally { setSaving(false); }
    };

    const handleAddNote = async () => {
        if (!selectedEncounter || !note.content) return;
        setSaving(true);
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ encounterId: selectedEncounter.id, patientId: selectedEncounter.patient.id, noteType: note.noteType, content: note.content, authorId: 'doctor-1', authorRole: 'Doctor' }),
            });
            if (response.ok) { toast({ title: 'Success', description: 'Note added' }); setShowNoteModal(false); setNote({ noteType: 'progress', content: '' }); }
        } catch { toast({ title: 'Error', description: 'Failed to add note', variant: 'destructive' }); } finally { setSaving(false); }
    };

    const openEMR = (encounter: Encounter) => { setSelectedEncounter(encounter); setShowEMRDrawer(true); fetchEMR(encounter.patient.id); };
    const openLabResults = (encounter: Encounter) => { setSelectedEncounter(encounter); setShowLabResultsModal(true); fetchEMR(encounter.patient.id); };

    const commonLabTests = [
        { orderCode: 'CBC', orderName: 'Complete Blood Count' }, { orderCode: 'LFT', orderName: 'Liver Function Test' },
        { orderCode: 'KFT', orderName: 'Kidney Function Test' }, { orderCode: 'LIPID', orderName: 'Lipid Profile' },
        { orderCode: 'TFT', orderName: 'Thyroid Function Test' }, { orderCode: 'HbA1c', orderName: 'Glycated Hemoglobin' },
        { orderCode: 'TROP', orderName: 'Troponin' }, { orderCode: 'ECG', orderName: 'Electrocardiogram' },
    ];

    const toggleLabOrder = (test: { orderCode: string; orderName: string }) => {
        const exists = labOrders.find(o => o.orderCode === test.orderCode);
        if (exists) setLabOrders(labOrders.filter(o => o.orderCode !== test.orderCode));
        else setLabOrders([...labOrders, { ...test, priority: 'ROUTINE' }]);
    };

    const filteredAndSortedEncounters = encounters
        .filter(e => {
            const matchesSearch = e.patient.name.toLowerCase().includes(search.toLowerCase()) || e.patient.uhid.toLowerCase().includes(search.toLowerCase()) || (e.patient.contact && e.patient.contact.includes(search));
            const matchesType = filterType === 'all' || e.type === filterType;
            return matchesSearch && matchesType;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name': comparison = a.patient.name.localeCompare(b.patient.name); break;
                case 'time': comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); break;
                case 'type': comparison = a.type.localeCompare(b.type); break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const openForPatient = (encounter: Encounter, modal: 'prescription' | 'lab' | 'note') => {
        setSelectedEncounter(encounter);
        if (modal === 'prescription') setShowPrescriptionModal(true);
        if (modal === 'lab') setShowLabOrderModal(true);
        if (modal === 'note') setShowNoteModal(true);
    };

    const getCurrentBed = (encounter: Encounter) => encounter.bedAssignments?.length > 0 ? encounter.bedAssignments[0].bed : null;

    const toggleAppointments = () => {
        if (!showAppointmentsPanel) fetchAppointments();
        setShowAppointmentsPanel(!showAppointmentsPanel);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Stethoscope className="w-6 h-6 text-primary" />Doctor Workstation</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage your schedule and appointments</p>
                </div>
            </div>

            {/* Doctor Schedule */}
            <div className="floating-card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium flex items-center gap-2"><CalendarDays className="w-4 h-4" />Weekly Schedule</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek('prev')}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="text-sm font-medium">{formatDate(weekDays[0])} - {formatDate(weekDays[6])}</span>
                        <Button variant="ghost" size="sm" onClick={() => navigateWeek('next')}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
                {appointmentsLoading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                ) : (
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map((day, idx) => {
                            const dayAppointments = getAppointmentsForDay(day);
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedDayForAppointments(day)}
                                    className={cn("p-2 rounded-lg border min-h-[120px] text-left hover:bg-muted/50 transition-colors cursor-pointer", isToday(day) ? "border-primary bg-primary/5" : "border-border")}
                                >
                                    <div className={cn("text-center mb-2", isToday(day) && "text-primary font-medium")}>
                                        <p className="text-xs">{formatDayName(day)}</p>
                                        <p className="text-lg font-semibold">{day.getDate()}</p>
                                    </div>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {dayAppointments.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center">No appointments</p>
                                        ) : dayAppointments.slice(0, 3).map(apt => (
                                            <div key={apt.id} className={cn("p-1.5 rounded text-xs", apt.status === 'scheduled' ? 'bg-blue-100 dark:bg-blue-900/30' : apt.status === 'completed' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800')}>
                                                <p className="font-medium truncate">{apt.patient.name}</p>
                                                <p className="text-muted-foreground">{formatTime(apt.scheduledAt)}</p>
                                            </div>
                                        ))}
                                        {dayAppointments.length > 3 && (
                                            <p className="text-xs text-primary font-medium text-center">+{dayAppointments.length - 3} more</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* EMR Drawer - Same as before but with radiology results */}
            {showEMRDrawer && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex justify-end z-50">
                    <div className="bg-background w-full max-w-2xl h-full overflow-y-auto p-6 animate-in slide-in-from-right">
                        <div className="flex items-center justify-between mb-6"><div><h2 className="text-lg font-semibold">Electronic Medical Records</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name} ({selectedEncounter.patient.uhid})</p></div><Button variant="ghost" size="sm" onClick={() => setShowEMRDrawer(false)}><X className="w-4 h-4" /></Button></div>
                        {emrLoading ? (<div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>) : emrData ? (
                            <div className="space-y-6">
                                <div className="p-4 bg-muted/30 rounded-lg"><h3 className="font-medium mb-2">Patient Summary</h3><div className="grid grid-cols-2 gap-2 text-sm"><div><span className="text-muted-foreground">Blood Group:</span> {emrData.patient.bloodGroup || 'N/A'}</div><div><span className="text-muted-foreground">Gender:</span> {emrData.patient.gender}</div><div><span className="text-muted-foreground">DOB:</span> {formatDate(emrData.patient.dob)}</div><div><span className="text-muted-foreground">Age:</span> {getAge(emrData.patient.dob)} years</div></div>{emrData.patient.allergies?.length > 0 && (<div className="mt-3 p-2 bg-status-critical/10 rounded flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-status-critical mt-0.5" /><div><p className="text-sm font-medium text-status-critical">Allergies</p><p className="text-xs text-status-critical">{emrData.patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ')}</p></div></div>)}</div>
                                <div><h3 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4" />Clinical Notes ({emrData.clinicalNotes.length})</h3><div className="space-y-2 max-h-64 overflow-y-auto">{emrData.clinicalNotes.length === 0 ? (<p className="text-sm text-muted-foreground">No clinical notes found</p>) : emrData.clinicalNotes.map(note => (<div key={note.id} className="p-3 border rounded-lg"><div className="flex items-center justify-between mb-1"><span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">{note.noteType}</span><span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span></div><p className="text-sm mt-2">{note.content}</p><p className="text-xs text-muted-foreground mt-1">By {note.authorRole} • {note.encounterType}</p></div>))}</div></div>
                                <div><h3 className="font-medium mb-3 flex items-center gap-2"><Pill className="w-4 h-4" />Prescriptions ({emrData.prescriptions.length})</h3><div className="space-y-2 max-h-64 overflow-y-auto">{emrData.prescriptions.length === 0 ? (<p className="text-sm text-muted-foreground">No prescriptions found</p>) : emrData.prescriptions.map(rx => (<div key={rx.id} className="p-3 border rounded-lg"><div className="flex items-center justify-between mb-2"><span className={cn("text-xs px-2 py-0.5 rounded", rx.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600')}>{rx.status}</span><span className="text-xs text-muted-foreground">{formatDateTime(rx.prescribedAt)}</span></div><div className="space-y-1">{rx.medications.map((med, i) => (<div key={i} className="text-sm"><span className="font-medium">{med.medicationName}</span><span className="text-muted-foreground"> - {med.dosage}, {med.frequency}, {med.duration}</span></div>))}</div>{rx.prescriptionImageUrl && (<div className="mt-2"><a href={rx.prescriptionImageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline"><ImageIcon className="w-3 h-3" />View Prescription Image</a></div>)}<p className="text-xs text-muted-foreground mt-1">By {rx.prescribedBy} • {rx.encounterType}</p></div>))}</div></div>
                            </div>
                        ) : (<p className="text-muted-foreground">Failed to load EMR data</p>)}
                    </div>
                </div>
            )}

            {/* Lab & Radiology Results Modal */}
            {showLabResultsModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Diagnostic Reports</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name} ({selectedEncounter.patient.uhid})</p></div><Button variant="ghost" size="sm" onClick={() => setShowLabResultsModal(false)}><X className="w-4 h-4" /></Button></div>

                        {/* Tab Buttons */}
                        <div className="flex gap-2 mb-4 border-b pb-2">
                            <button onClick={() => setLabReportTab('lab')} className={cn("px-4 py-2 rounded-t-lg font-medium text-sm transition-colors", labReportTab === 'lab' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                                <FlaskConical className="w-4 h-4 inline mr-2" />Lab Results ({emrData?.labResults.length || 0})
                            </button>
                            <button onClick={() => setLabReportTab('radiology')} className={cn("px-4 py-2 rounded-t-lg font-medium text-sm transition-colors", labReportTab === 'radiology' ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
                                <FileImage className="w-4 h-4 inline mr-2" />Radiology ({emrData?.radiologyResults?.length || 0})
                            </button>
                        </div>

                        {emrLoading ? (<div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>) : (
                            <div className="space-y-3">
                                {labReportTab === 'lab' ? (
                                    emrData?.labResults.length === 0 ? (<p className="text-center text-muted-foreground py-8">No lab results found</p>) : emrData?.labResults.map(lab => (
                                        <div key={lab.orderId} className={cn("p-4 border rounded-lg", lab.result?.isCritical && "border-status-critical bg-status-critical/5")}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3"><FlaskConical className={cn("w-5 h-5", lab.result?.isCritical ? "text-status-critical" : "text-primary")} /><div><p className="font-medium">{lab.orderName}</p><p className="text-xs text-muted-foreground">{lab.orderCode}</p></div></div>
                                                <div className="text-right"><span className={cn("text-xs px-2 py-1 rounded", lab.status === 'completed' ? 'bg-green-100 text-green-700' : lab.status === 'ordered' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600')}>{lab.status}</span>{lab.result?.isCritical && <span className="ml-2 px-2 py-1 text-xs bg-status-critical/10 text-status-critical rounded">CRITICAL</span>}</div>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><span className="text-muted-foreground">Ordered:</span> {formatDateTime(lab.orderedAt)}</div>{lab.result && <div><span className="text-muted-foreground">Resulted:</span> {formatDateTime(lab.result.resultedAt)}</div>}</div>
                                            {lab.result && (
                                                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                                                    {lab.result.normalRange && <p className="text-sm"><span className="font-medium">Normal Range:</span> {lab.result.normalRange}</p>}
                                                    {lab.result.interpretation && <p className="text-sm mt-1"><span className="font-medium">Interpretation:</span> {lab.result.interpretation}</p>}
                                                    {lab.result.result && typeof lab.result.result === 'object' && (
                                                        <div className="mt-2 text-sm">
                                                            <span className="font-medium">Values:</span>
                                                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">{JSON.stringify(lab.result.result, null, 2)}</pre>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    emrData?.radiologyResults?.length === 0 ? (<p className="text-center text-muted-foreground py-8">No radiology reports found</p>) : emrData?.radiologyResults?.map(rad => (
                                        <div key={rad.orderId} className="p-4 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3"><FileImage className="w-5 h-5 text-primary" /><div><p className="font-medium">{rad.orderName}</p><p className="text-xs text-muted-foreground">{rad.orderCode}</p></div></div>
                                                <span className={cn("text-xs px-2 py-1 rounded", rad.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700')}>{rad.status}</span>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><div><span className="text-muted-foreground">Ordered:</span> {formatDateTime(rad.orderedAt)}</div>{rad.result && <div><span className="text-muted-foreground">Performed:</span> {formatDateTime(rad.result.performedAt)}</div>}</div>
                                            {rad.result && (
                                                <div className="mt-3 space-y-3">
                                                    <div className="p-3 bg-muted/30 rounded-lg">
                                                        <p className="text-sm"><span className="font-medium">Findings:</span> {rad.result.findings}</p>
                                                        <p className="text-sm mt-2"><span className="font-medium">Impression:</span> {rad.result.impression}</p>
                                                    </div>
                                                    {/* Report PDF */}
                                                    {rad.result.reportUrl && (
                                                        <a href={rad.result.reportUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                            <Download className="w-5 h-5 text-primary" />
                                                            <div><p className="font-medium text-sm">Download Report PDF</p><p className="text-xs text-muted-foreground">Click to view/download the full report</p></div>
                                                        </a>
                                                    )}
                                                    {/* Image URLs */}
                                                    {rad.result.imageUrls && rad.result.imageUrls.length > 0 && (
                                                        <div>
                                                            <p className="text-sm font-medium mb-2">Images ({rad.result.imageUrls.length})</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {rad.result.imageUrls.map((url, idx) => (
                                                                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg border overflow-hidden hover:opacity-80 transition-opacity">
                                                                        <img src={url} alt={`Image ${idx + 1}`} className="w-full h-full object-cover" />
                                                                    </a>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Prescription Modal */}
            {showPrescriptionModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Write Prescription</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name} ({selectedEncounter.patient.uhid})</p></div><Button variant="ghost" size="sm" onClick={() => setShowPrescriptionModal(false)}><X className="w-4 h-4" /></Button></div>
                        {selectedEncounter.patient.allergies?.length > 0 && (<div className="bg-status-critical/10 border border-status-critical/20 rounded-lg p-3 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-status-critical" /><span className="text-sm text-status-critical font-medium">Known Allergies: {selectedEncounter.patient.allergies.map(a => `${a.allergen} (${a.severity})`).join(', ')}</span></div>)}
                        <div className="mb-6 p-4 border-2 border-dashed rounded-lg"><Label className="flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4" />Prescription Image (Optional)</Label><p className="text-xs text-muted-foreground mb-3">Upload a handwritten or scanned prescription image</p>{prescriptionImage ? (<div className="relative inline-block"><img src={prescriptionImage} alt="Prescription" className="max-h-48 rounded-lg border" /><Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setPrescriptionImage(null); setPrescriptionOcrText(''); }}><X className="w-3 h-3" /></Button></div>) : (<label className="flex items-center justify-center gap-2 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"><Upload className="w-5 h-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Click to upload image</span><input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} /></label>)}
                            {/* OCR Extracted Text Section */}
                            {prescriptionImage && (
                                <div className="mt-4">
                                    <Label className="flex items-center gap-2 mb-2"><FileText className="w-4 h-4" />Extracted Prescription Text</Label>
                                    {ocrLoading ? (
                                        <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm text-muted-foreground">Extracting text from image...</span></div>
                                    ) : (
                                        <textarea
                                            className="w-full p-3 border rounded-lg min-h-[100px] resize-none text-sm"
                                            placeholder="OCR extracted text will appear here. You can edit it if needed."
                                            value={prescriptionOcrText}
                                            onChange={(e) => setPrescriptionOcrText(e.target.value)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="space-y-4">
                            {medications.map((med, index) => (
                                <div key={index} className="p-4 bg-muted/30 rounded-lg space-y-3">
                                    <div className="flex items-center justify-between"><span className="text-sm font-medium">Medication {index + 1}</span>{medications.length > 1 && (<Button variant="ghost" size="sm" onClick={() => removeMedication(index)}><X className="w-4 h-4" /></Button>)}</div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 relative"><Label>Medication Name</Label><Input placeholder="Start typing to search medicines..." value={med.medicationName} onChange={(e) => updateMedication(index, 'medicationName', e.target.value)} onFocus={() => setActiveMedIndex(index)} />
                                            {activeMedIndex === index && medicationSuggestions.length > 0 && (<div className="absolute z-10 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">{medSearchLoading ? (<div className="p-3 text-center"><Loader2 className="w-4 h-4 animate-spin inline" /></div>) : (medicationSuggestions.map(m => (<button key={m.id} className="w-full p-2 text-left hover:bg-muted/50 text-sm" onClick={() => selectMedication(index, m)}><p className="font-medium">{m.name}</p>{m.genericName && <p className="text-xs text-muted-foreground">{m.genericName}</p>}</button>)))}</div>)}
                                        </div>
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
            {showLabOrderModal && selectedEncounter && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-background rounded-xl max-w-lg w-full p-6"><div className="flex items-center justify-between mb-4"><div><h2 className="text-lg font-semibold">Order Lab Tests</h2><p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p></div><Button variant="ghost" size="sm" onClick={() => setShowLabOrderModal(false)}><X className="w-4 h-4" /></Button></div><div className="grid grid-cols-2 gap-2 mb-4">{commonLabTests.map((test) => (<button key={test.orderCode} onClick={() => toggleLabOrder(test)} className={cn("p-3 rounded-lg border text-left transition-all", labOrders.find(o => o.orderCode === test.orderCode) ? "bg-primary/10 border-primary" : "hover:bg-muted/50")}><p className="font-medium text-sm">{test.orderName}</p><p className="text-xs text-muted-foreground">{test.orderCode}</p></button>))}</div>{labOrders.length > 0 && (<div className="mb-4 p-3 bg-muted/30 rounded-lg"><p className="text-sm font-medium mb-2">Selected: {labOrders.length} tests</p><div className="flex flex-wrap gap-1">{labOrders.map(o => (<span key={o.orderCode} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">{o.orderCode}</span>))}</div></div>)}<div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setShowLabOrderModal(false)}>Cancel</Button><Button onClick={handleLabOrder} disabled={saving || labOrders.length === 0}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Order {labOrders.length} Tests</Button></div></div></div>)}

            {/* Add Note Modal */}
            {showNoteModal && selectedEncounter && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-lg font-semibold">Add Clinical Note</h2>
                                <p className="text-sm text-muted-foreground">{selectedEncounter.patient.name}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setShowNoteModal(false); setNoteImage(null); setNoteOcrText(''); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label>Note Type</Label>
                                <select className="elegant-select" value={note.noteType} onChange={(e) => setNote(n => ({ ...n, noteType: e.target.value }))}>
                                    <option value="chief-complaint">Chief Complaint</option>
                                    <option value="history">History</option>
                                    <option value="progress">Progress Note</option>
                                    <option value="discharge">Discharge Note</option>
                                </select>
                            </div>

                            {/* Note Image Upload with OCR */}
                            <div className="p-4 border-2 border-dashed rounded-lg">
                                <Label className="flex items-center gap-2 mb-2"><ImageIcon className="w-4 h-4" />Upload Handwritten Note (Optional)</Label>
                                <p className="text-xs text-muted-foreground mb-3">Upload an image of handwritten notes to extract text</p>
                                {noteImage ? (
                                    <div className="relative inline-block">
                                        <img src={noteImage} alt="Note" className="max-h-32 rounded-lg border" />
                                        <Button variant="destructive" size="sm" className="absolute top-2 right-2" onClick={() => { setNoteImage(null); setNoteOcrText(''); }}>
                                            <X className="w-3 h-3" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        <Upload className="w-4 h-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Click to upload image</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleNoteImageUpload} />
                                    </label>
                                )}
                                {/* OCR Extracted Text Section */}
                                {noteImage && (
                                    <div className="mt-3">
                                        <Label className="flex items-center gap-2 mb-2 text-xs"><FileText className="w-3 h-3" />Extracted Text</Label>
                                        {ocrLoading ? (
                                            <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg"><Loader2 className="w-3 h-3 animate-spin" /><span className="text-xs text-muted-foreground">Extracting text...</span></div>
                                        ) : (
                                            <textarea
                                                className="w-full p-2 border rounded-lg min-h-[60px] resize-none text-xs"
                                                placeholder="Extracted text will appear here..."
                                                value={noteOcrText}
                                                onChange={(e) => setNoteOcrText(e.target.value)}
                                            />
                                        )}
                                        {noteOcrText && !ocrLoading && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2 w-full text-xs"
                                                onClick={() => setNote(n => ({ ...n, content: n.content ? n.content + '\n\n' + noteOcrText : noteOcrText }))}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />Add to Note Content
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label>Content</Label>
                                <textarea className="w-full p-3 border rounded-lg min-h-[150px] resize-none" placeholder="Enter clinical notes..." value={note.content} onChange={(e) => setNote(n => ({ ...n, content: e.target.value }))} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => { setShowNoteModal(false); setNoteImage(null); setNoteOcrText(''); }}>Cancel</Button>
                            <Button onClick={handleAddNote} disabled={saving || !note.content}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Save Note</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Day Detail Modal for Appointments */}
            {/* Day Detail Modal for Appointments */}
            {selectedDayForAppointments && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => setSelectedDayForAppointments(null)}>
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-primary" />
                                    Schedule for {formatDate(selectedDayForAppointments)}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {formatDayName(selectedDayForAppointments)} • {getAppointmentsForDay(selectedDayForAppointments).length} appointments
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedDayForAppointments(null)}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {getAppointmentsForDay(selectedDayForAppointments).length === 0 ? (
                            <div className="text-center py-12">
                                <CalendarDays className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No appointments scheduled for this day</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {getAppointmentsForDay(selectedDayForAppointments)
                                    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
                                    .map(apt => (
                                        <div key={apt.id} className={cn("p-4 border rounded-lg transition-colors hover:bg-muted/30", isToday(selectedDayForAppointments) && apt.status === 'scheduled' && "border-primary")}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                        {apt.patient.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{apt.patient.name}</p>
                                                        <p className="text-sm text-muted-foreground">{apt.patient.uhid} • {getAge(apt.patient.dob)}y {apt.patient.gender.charAt(0)}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {formatTime(apt.scheduledAt)}
                                                            </span>
                                                            {apt.duration && (
                                                                <span>{apt.duration} min</span>
                                                            )}
                                                            <span className="flex items-center gap-1">
                                                                {apt.department}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={cn("px-2 py-1 text-xs rounded font-medium",
                                                        apt.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                                                            apt.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                                apt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                    apt.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                                                                        'bg-gray-100 text-gray-700'
                                                    )}>
                                                        {apt.status}
                                                    </span>
                                                    {apt.visitType && (
                                                        <span className="text-xs text-muted-foreground">{apt.visitType}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {apt.notes && (
                                                <div className="mt-3 p-2 bg-muted/30 rounded text-sm">
                                                    <span className="font-medium">Notes:</span> {apt.notes}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}