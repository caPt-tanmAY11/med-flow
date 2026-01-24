"use client";

import { useEffect, useState } from 'react';
import { Users, Key, Shield, UserPlus, Search, RefreshCw, CheckCircle, AlertCircle, Loader2, Calendar, X, Copy, BedDouble, Stethoscope, ArrowRight, MoreHorizontal, FileText, FlaskConical, Pill, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface Nurse {
    id: string;
    name: string;
    email: string;
    role: string;
    currentDuty: {
        id: string;
        nurseId: string;
        shiftType: string;
        secretCode: string | null;
        isActive: boolean;
    } | null;
}

interface PatientAssignment {
    id: string; // encounterId
    patient: {
        id: string;
        name: string;
        uhid: string;
        gender: string;
    };
    bed: { bedNumber: string; ward: string } | null;
    type: string;
    status: string;
    assignedNurse: { nurseId: string; nurseName: string } | null;
    // We would fetch details on demand usually, but let's assume we can fetch them or have structure
}

export default function AdminNursingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [nurses, setNurses] = useState<Nurse[]>([]);
    const [assignments, setAssignments] = useState<PatientAssignment[]>([]);

    // UI State
    const [activeTab, setActiveTab] = useState("nurses");
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNurseName, setNewNurseName] = useState('');
    const [createdNurseCode, setCreatedNurseCode] = useState<{ name: string, code: string } | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    // Selection
    const [selectedPatient, setSelectedPatient] = useState<PatientAssignment | null>(null);
    const [selectedNurseId, setSelectedNurseId] = useState('');

    // Details Modal
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsType, setDetailsType] = useState<'emr' | 'labs' | 'notes'>('emr');
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [detailsData, setDetailsData] = useState<any>({});

    const fetchDetails = async (encounterId: string, type: string) => {
        setLoadingDetails(true);
        setDetailsData({});
        try {
            const res = await fetch(`/api/admin/nursing/details?encounterId=${encounterId}&type=${type}`);
            const result = await res.json();
            if (res.ok) setDetailsData(result.data || {});
        } catch { }
        finally { setLoadingDetails(false); }
    };

    // Trigger on modal open
    const openDetails = (patientId: string, type: 'emr' | 'labs' | 'notes') => {
        setDetailsType(type);
        setShowDetailsModal(true);
        fetchDetails(patientId, type);
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [nursesRes, assignmentsRes] = await Promise.all([
                fetch('/api/admin/nurses'),
                fetch('/api/admin/nursing/assignments')
            ]);

            const nursesData = await nursesRes.json();
            const assignmentsData = await assignmentsRes.json();

            if (nursesRes.ok) setNurses(nursesData.data || []);
            if (assignmentsRes.ok) setAssignments(assignmentsData.data || []);

        } catch { toast({ title: 'Error', variant: 'destructive' }); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Actions ---

    const handleGenerateCode = async (nurse: Nurse) => {
        try {
            const res = await fetch('/api/nursing?action=generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: nurse.id, nurseName: nurse.name }),
            });
            const result = await res.json();
            if (res.ok) {
                toast({ title: 'Code Generated', description: `${result.data.code}` });
                fetchData();
            }
        } catch { }
    };

    const handleToggleDuty = async (nurse: Nurse) => {
        try {
            const isActive = !nurse.currentDuty?.isActive;
            const res = await fetch('/api/nursing?action=toggle-duty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: nurse.id, isActive }),
            });
            if (res.ok) {
                toast({ title: 'Success', description: `Marked ${nurse.name} as ${isActive ? 'On Duty' : 'Off Duty'}` });
                fetchData();
            }
        } catch { }
    };

    const handleAddNurse = async () => {
        if (!newNurseName.trim()) return;
        try {
            const res = await fetch('/api/admin/nurses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newNurseName }),
            });
            const result = await res.json();
            if (res.ok) {
                setCreatedNurseCode({ name: newNurseName, code: result.secretCode });
                setShowAddModal(false);
                setNewNurseName('');
                fetchData();
            }
        } catch { }
    };

    const handleAssignNurse = async () => {
        if (!selectedPatient || !selectedNurseId) return;
        try {
            const nurse = nurses.find(n => n.id === selectedNurseId);
            const res = await fetch('/api/admin/nursing/assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nurseId: nurse?.id,
                    nurseName: nurse?.name,
                    encounterId: selectedPatient.id,
                    patientId: selectedPatient.patient.id,
                }),
            });
            if (res.ok) {
                setShowAssignModal(false);
                fetchData();
                toast({ title: 'Assigned successfully' });
            }
        } catch { }
    };

    // Filter
    const filteredNurses = nurses.filter(n => n.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const activeNurses = nurses.filter(n => n.currentDuty?.isActive);

    return (
        <div className="space-y-6 p-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Nursing Administration</h1>
                    <p className="text-muted-foreground">Manage staff and patients.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={fetchData} variant="outline" size="sm"><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button>
                    <Button onClick={() => setShowAddModal(true)} size="sm"><UserPlus className="w-4 h-4 mr-2" /> Add Nurse</Button>
                </div>
            </div>

            <Tabs defaultValue="nurses" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="nurses">Staff Management</TabsTrigger>
                    <TabsTrigger value="assignments">Patient Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="nurses" className="space-y-4 pt-4">
                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border max-w-sm"><Search className="w-4 h-4 text-muted-foreground" /><Input className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto" placeholder="Search nurses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {loading ? <div className="col-span-full text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div> : filteredNurses.map(nurse => (
                            <Card key={nurse.id} className="overflow-hidden">
                                <CardHeader className="bg-muted/30 pb-4">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">{nurse.name.charAt(0)}</div>
                                            <div><CardTitle className="text-base">{nurse.name}</CardTitle><CardDescription className="text-xs">{nurse.role}</CardDescription></div>
                                        </div>
                                        <Badge variant={nurse.currentDuty?.isActive ? "default" : "secondary"}>{nurse.currentDuty?.isActive ? "On Duty" : "Off Duty"}</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground flex items-center gap-2"><Key className="w-4 h-4" /> Code</span>
                                        {nurse.currentDuty?.secretCode ? <span className="font-mono font-bold bg-muted px-2 rounded">{nurse.currentDuty.secretCode}</span> : <span className="text-muted-foreground italic">None</span>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <Button size="sm" variant="outline" onClick={() => handleGenerateCode(nurse)}>Generate Code</Button>
                                        <Button size="sm" variant={nurse.currentDuty?.isActive ? "destructive" : "secondary"} onClick={() => handleToggleDuty(nurse)}>
                                            {nurse.currentDuty?.isActive ? <><PowerOff className="w-3 h-3 mr-2" /> Off Duty</> : <><Power className="w-3 h-3 mr-2" /> On Duty</>}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="assignments" className="pt-4">
                    <Card>
                        <CardHeader><CardTitle>Inpatient Assignments</CardTitle></CardHeader>
                        <CardContent>
                            {loading ? <div className="text-center py-8">Loading...</div> : assignments.map(patient => (
                                <div key={patient.id} className="grid grid-cols-12 gap-4 p-4 border-b last:border-0 items-center hover:bg-muted/10">
                                    <div className="col-span-4">
                                        <p className="font-semibold">{patient.patient.name}</p>
                                        <p className="text-xs text-muted-foreground">{patient.patient.uhid}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <Badge variant="outline">Bed {patient.bed?.bedNumber || 'N/A'}</Badge>
                                    </div>
                                    <div className="col-span-3">
                                        {patient.assignedNurse ?
                                            <span className="flex items-center gap-2 font-medium text-green-700 bg-green-50 px-2 py-1 rounded max-w-fit"><span className="w-2 h-2 rounded-full bg-green-500"></span> {patient.assignedNurse.nurseName}</span>
                                            : <span className="text-yellow-600 text-sm flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Unassigned</span>}
                                    </div>
                                    <div className="col-span-2 text-right flex justify-end gap-2">
                                        <Button size="sm" variant="outline" onClick={() => { setSelectedPatient(patient); setSelectedNurseId(nurses.find(n => n.id === patient.assignedNurse?.nurseId)?.id || ''); setShowAssignModal(true); }}>
                                            <ArrowRight className="w-4 h-4 mr-1" /> Rollover
                                        </Button>
                                        <Button size="sm" onClick={() => { setSelectedPatient(patient); setSelectedNurseId(nurses.find(n => n.id === patient.assignedNurse?.nurseId)?.id || ''); setShowAssignModal(true); }}>
                                            Assign
                                        </Button>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Patient Details</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => openDetails(patient.id, 'emr')}><FileText className="w-4 h-4 mr-2" /> EMR / Notes</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openDetails(patient.id, 'labs')}><FlaskConical className="w-4 h-4 mr-2" /> Lab Reports</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openDetails(patient.id, 'notes')}><Copy className="w-4 h-4 mr-2" /> Nurse Logs</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle>Add Nurse</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Name</Label><Input value={newNurseName} onChange={e => setNewNurseName(e.target.value)} />
                        <Button className="w-full" onClick={handleAddNurse}>Create</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!createdNurseCode} onOpenChange={(o) => !o && setCreatedNurseCode(null)}>
                <DialogContent className="text-center sm:max-w-sm">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <DialogTitle>Nurse Created</DialogTitle>
                    <div className="text-4xl font-mono font-bold bg-muted p-4 rounded-xl my-4">{createdNurseCode?.code}</div>
                    <Button onClick={() => setCreatedNurseCode(null)} className="w-full">Done</Button>
                </DialogContent>
            </Dialog>

            <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Assign Nurse</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <Label>Select Nurse</Label>
                        <Select value={selectedNurseId} onValueChange={setSelectedNurseId}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                                {activeNurses.map(n => <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleAssignNurse} className="w-full">Confirm Assignment</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Details Modal */}
            <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {detailsType === 'emr' && 'EMR & Prescriptions'}
                            {detailsType === 'labs' && 'Lab Reports'}
                            {detailsType === 'notes' && 'Nurse Logs & Audit'}
                        </DialogTitle>
                    </DialogHeader>
                    {loadingDetails ? (
                        <div className="py-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                        <div className="space-y-4">
                            {detailsType === 'emr' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2"><FileText className="w-4 h-4" /> Clinical Notes</h3>
                                        {detailsData.notes?.length ? detailsData.notes.map((n: any) => (
                                            <div key={n.id} className="border p-3 rounded mb-2 bg-muted/20">
                                                <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>{n.authorRole}</span><span>{new Date(n.createdAt).toLocaleString()}</span></div>
                                                <p className="text-sm">{n.content}</p>
                                            </div>
                                        )) : <p className="text-muted-foreground text-sm italic">No notes found.</p>}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2"><Pill className="w-4 h-4" /> Prescriptions</h3>
                                        {detailsData.prescriptions?.length ? detailsData.prescriptions.map((p: any) => (
                                            <div key={p.id} className="border p-3 rounded mb-2">
                                                <div className="text-xs text-muted-foreground mb-1">{new Date(p.prescribedAt).toLocaleString()}</div>
                                                <ul className="list-disc list-inside text-sm">
                                                    {p.medications.map((m: any) => <li key={m.id}>{m.medicationName} ({m.dosage})</li>)}
                                                </ul>
                                            </div>
                                        )) : <p className="text-muted-foreground text-sm italic">No prescriptions found.</p>}
                                    </div>
                                </div>
                            )}

                            {detailsType === 'labs' && (
                                <div>
                                    {detailsData.labs?.length ? detailsData.labs.map((order: any) => (
                                        <div key={order.id} className="border p-3 rounded mb-2 flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-sm">{order.orderName}</p>
                                                <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                                            </div>
                                            <Badge variant={order.labResult ? "default" : "outline"}>{order.labResult ? "Result Ready" : "Pending"}</Badge>
                                        </div>
                                    )) : <p className="text-muted-foreground text-center py-4">No active lab orders.</p>}
                                </div>
                            )}

                            {detailsType === 'notes' && (
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="font-semibold mb-2">Vitals Log</h3>
                                        {detailsData.vitals?.length ? (
                                            <div className="border rounded-lg overflow-hidden">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-muted text-muted-foreground">
                                                        <tr>
                                                            <th className="p-2">Time</th>
                                                            <th className="p-2">Nurse</th>
                                                            <th className="p-2">BP</th>
                                                            <th className="p-2">Pulse</th>
                                                            <th className="p-2">Temp</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {detailsData.vitals.map((v: any) => (
                                                            <tr key={v.id} className="border-t">
                                                                <td className="p-2">{new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                                                                <td className="p-2">{v.recordedBy}</td>
                                                                <td className="p-2">{v.bpSystolic}/{v.bpDiastolic}</td>
                                                                <td className="p-2">{v.pulse}</td>
                                                                <td className="p-2">{v.temperature}°</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : <p className="text-muted-foreground text-sm italic">No vitals recorded.</p>}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Handover Log</h3>
                                        {detailsData.handovers?.length ? detailsData.handovers.map((h: any) => (
                                            <div key={h.id} className="border p-3 rounded mb-2 bg-blue-50/50">
                                                <div className="flex justify-between text-xs font-medium mb-1">
                                                    <span>{h.outgoingNurse} → {h.incomingNurse}</span>
                                                    <span>{new Date(h.handoverAt).toLocaleString()}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{h.patientSummary}</p>
                                            </div>
                                        )) : <p className="text-muted-foreground text-sm italic">No handovers found.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
