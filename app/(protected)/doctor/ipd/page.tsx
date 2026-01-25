"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Activity, Bed, FileText, AlertCircle } from "lucide-react";

interface IPDPatient {
    encounterId: string;
    patientId: string;
    name: string;
    uhid: string;
    age: number;
    gender: string;
    bedNumber: string;
    ward: string;
    diagnosis: string;
    admissionDate: string;
    allergies: string[];
    lastVitals: {
        temperature: number;
        bpSystolic: number;
        bpDiastolic: number;
        pulse: number;
        spO2: number;
    } | null;
}

export default function DoctorIPDPage() {
    const { data: session } = useSession();
    const [patients, setPatients] = useState<IPDPatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<IPDPatient | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const res = await fetch("/api/doctor/my-patients");
            if (res.ok) {
                const data = await res.json();
                setPatients(data);
                if (data.length > 0) setSelectedPatient(data[0]);
            }
        } catch (error) {
            console.error("Failed to fetch patients", error);
        } finally {
            setLoading(false);
        }
    };

    const [medicationForm, setMedicationForm] = useState({ name: "", dosage: "", frequency: "", duration: "" });
    const [vitalsForm, setVitalsForm] = useState({ bpSystolic: "", bpDiastolic: "", pulse: "", temperature: "", spO2: "" });
    const [noteContent, setNoteContent] = useState("");
    const [selectedLabTest, setSelectedLabTest] = useState("CBC");

    const saveVitals = async () => {
        if (!selectedPatient) return;
        try {
            const res = await fetch("/api/vitals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: selectedPatient.encounterId,
                    patientId: selectedPatient.patientId,
                    ...vitalsForm
                })
            });
            if (res.ok) {
                alert("Vitals saved successfully");
                setVitalsForm({ bpSystolic: "", bpDiastolic: "", pulse: "", temperature: "", spO2: "" });
            }
        } catch (error) {
            console.error("Failed to save vitals", error);
        }
    };

    const saveNote = async () => {
        if (!selectedPatient) return;
        try {
            const res = await fetch("/api/clinical-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: selectedPatient.encounterId,
                    patientId: selectedPatient.patientId,
                    content: noteContent,
                    noteType: "progress"
                })
            });
            if (res.ok) {
                alert("Note saved successfully");
                setNoteContent("");
            }
        } catch (error) {
            console.error("Failed to save note", error);
        }
    };

    const addMedication = async () => {
        if (!selectedPatient) return;
        try {
            const res = await fetch("/api/prescriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: selectedPatient.encounterId,
                    patientId: selectedPatient.patientId,
                    medicationName: medicationForm.name,
                    dosage: medicationForm.dosage,
                    frequency: medicationForm.frequency,
                    duration: medicationForm.duration
                })
            });
            if (res.ok) {
                alert("Medication added successfully");
                setMedicationForm({ name: "", dosage: "", frequency: "", duration: "" });
            }
        } catch (error) {
            console.error("Failed to add medication", error);
        }
    };

    const orderLabTest = async () => {
        if (!selectedPatient) return;
        try {
            // For IPD, we create an order with status 'ordered' (active)
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: selectedPatient.encounterId,
                    patientId: selectedPatient.patientId,
                    orderType: "lab",
                    orderCode: selectedLabTest,
                    orderName: selectedLabTest,
                    orderedBy: session?.user?.name || "Doctor",
                    status: "ordered"
                })
            });
            if (res.ok) {
                alert("Lab test ordered successfully");
            }
        } catch (error) {
            console.error("Failed to order lab test", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">IPD Rounds</h1>
                    <p className="text-muted-foreground">Manage your admitted patients</p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                        {session?.user?.name}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Patient List Sidebar */}
                <Card className="md:col-span-1 h-[calc(100vh-12rem)]">
                    <CardHeader>
                        <CardTitle className="text-lg">My Patients ({patients.length})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-16rem)]">
                            {loading ? (
                                <div className="p-4 text-center text-muted-foreground">Loading...</div>
                            ) : patients.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">No active IPD patients</div>
                            ) : (
                                <div className="divide-y">
                                    {patients.map((patient) => (
                                        <div
                                            key={patient.encounterId}
                                            className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${selectedPatient?.encounterId === patient.encounterId ? 'bg-muted' : ''}`}
                                            onClick={() => setSelectedPatient(patient)}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-medium truncate">{patient.name}</span>
                                                <Badge variant={patient.lastVitals?.spO2 && patient.lastVitals.spO2 < 95 ? "destructive" : "outline"} className="text-xs">
                                                    Bed {patient.bedNumber}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {patient.gender}, {patient.age}y
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate mt-1">
                                                {patient.diagnosis}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Patient Details Main Area */}
                <Card className="md:col-span-3 h-[calc(100vh-12rem)] overflow-hidden flex flex-col">
                    {selectedPatient ? (
                        <>
                            <div className="border-b p-6 bg-muted/20">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                                            <User className="h-8 w-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">{selectedPatient.name}</h2>
                                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                <span className="flex items-center gap-1"><Bed className="h-4 w-4" /> {selectedPatient.ward} - Bed {selectedPatient.bedNumber}</span>
                                                <span>UHID: {selectedPatient.uhid}</span>
                                                <span>Admitted: {new Date(selectedPatient.admissionDate).toLocaleDateString()}</span>
                                            </div>
                                            {selectedPatient.allergies.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {selectedPatient.allergies.map(a => (
                                                        <Badge key={a} variant="destructive" className="text-xs">{a}</Badge>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline">Discharge Summary</Button>
                                        <Button>Add Notes</Button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden">
                                <Tabs defaultValue="overview" className="h-full flex flex-col">
                                    <div className="px-6 pt-4 border-b">
                                        <TabsList>
                                            <TabsTrigger value="overview">Overview</TabsTrigger>
                                            <TabsTrigger value="vitals">Vitals Chart</TabsTrigger>
                                            <TabsTrigger value="medications">Medications</TabsTrigger>
                                            <TabsTrigger value="notes">Progress Notes</TabsTrigger>
                                            <TabsTrigger value="labs">Lab Reports</TabsTrigger>
                                        </TabsList>
                                    </div>

                                    <ScrollArea className="flex-1">
                                        <div className="p-6">
                                            <TabsContent value="overview" className="mt-0 space-y-6">
                                                {/* Vitals Summary */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <Card>
                                                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">BP</CardTitle></CardHeader>
                                                        <CardContent className="p-4 pt-0 text-2xl font-bold">
                                                            {selectedPatient.lastVitals ? `${selectedPatient.lastVitals.bpSystolic}/${selectedPatient.lastVitals.bpDiastolic}` : "--/--"}
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Pulse</CardTitle></CardHeader>
                                                        <CardContent className="p-4 pt-0 text-2xl font-bold">
                                                            {selectedPatient.lastVitals?.pulse || "--"} <span className="text-sm font-normal text-muted-foreground">bpm</span>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">SpO2</CardTitle></CardHeader>
                                                        <CardContent className="p-4 pt-0 text-2xl font-bold">
                                                            {selectedPatient.lastVitals?.spO2 || "--"} <span className="text-sm font-normal text-muted-foreground">%</span>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader className="p-4 pb-2"><CardTitle className="text-sm font-medium">Temp</CardTitle></CardHeader>
                                                        <CardContent className="p-4 pt-0 text-2xl font-bold">
                                                            {selectedPatient.lastVitals?.temperature || "--"} <span className="text-sm font-normal text-muted-foreground">°F</span>
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Diagnosis & Plan */}
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex items-center gap-2">
                                                            <Activity className="h-5 w-5" /> Current Diagnosis
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-lg font-medium">{selectedPatient.diagnosis}</p>
                                                        <p className="text-muted-foreground mt-2">
                                                            Plan: Monitor vitals q4h, IV antibiotics started. Review labs in morning.
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>

                                            <TabsContent value="vitals" className="mt-0">
                                                <div className="space-y-4 max-w-2xl">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">BP (Systolic/Diastolic)</label>
                                                            <div className="flex gap-2">
                                                                <input
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                    placeholder="120"
                                                                    value={vitalsForm.bpSystolic}
                                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, bpSystolic: e.target.value })}
                                                                />
                                                                <span className="self-center">/</span>
                                                                <input
                                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                    placeholder="80"
                                                                    value={vitalsForm.bpDiastolic}
                                                                    onChange={(e) => setVitalsForm({ ...vitalsForm, bpDiastolic: e.target.value })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Pulse (bpm)</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="72"
                                                                value={vitalsForm.pulse}
                                                                onChange={(e) => setVitalsForm({ ...vitalsForm, pulse: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Temperature (°F)</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="98.6"
                                                                value={vitalsForm.temperature}
                                                                onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">SpO2 (%)</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="98"
                                                                value={vitalsForm.spO2}
                                                                onChange={(e) => setVitalsForm({ ...vitalsForm, spO2: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button onClick={saveVitals}>Record Vitals</Button>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="medications" className="mt-0">
                                                <div className="space-y-4 max-w-2xl">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Medicine Name</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="e.g. Paracetamol"
                                                                value={medicationForm.name}
                                                                onChange={(e) => setMedicationForm({ ...medicationForm, name: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Dosage</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="e.g. 500mg"
                                                                value={medicationForm.dosage}
                                                                onChange={(e) => setMedicationForm({ ...medicationForm, dosage: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Frequency</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="e.g. TDS"
                                                                value={medicationForm.frequency}
                                                                onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Duration</label>
                                                            <input
                                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                                placeholder="e.g. 5 days"
                                                                value={medicationForm.duration}
                                                                onChange={(e) => setMedicationForm({ ...medicationForm, duration: e.target.value })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button onClick={addMedication}>Add Medication</Button>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="notes" className="mt-0">
                                                <div className="space-y-4 max-w-2xl">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Progress Note</label>
                                                        <textarea
                                                            className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            placeholder="Patient condition, plan updates..."
                                                            value={noteContent}
                                                            onChange={(e) => setNoteContent(e.target.value)}
                                                        />
                                                    </div>
                                                    <Button onClick={saveNote}>Save Note</Button>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="labs" className="mt-0">
                                                <div className="space-y-4 max-w-2xl">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Select Test to Order</label>
                                                        <select
                                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                            value={selectedLabTest}
                                                            onChange={(e) => setSelectedLabTest(e.target.value)}
                                                        >
                                                            <option value="CBC">Complete Blood Count (CBC)</option>
                                                            <option value="LIPID">Lipid Profile</option>
                                                            <option value="LFT">Liver Function Test</option>
                                                            <option value="KFT">Kidney Function Test</option>
                                                            <option value="XRAY">X-Ray Chest PA</option>
                                                            <option value="USG">Ultrasound Abdomen</option>
                                                        </select>
                                                    </div>
                                                    <Button onClick={orderLabTest}>Order Test (Immediate)</Button>
                                                    <p className="text-xs text-muted-foreground">
                                                        Note: IPD orders are processed immediately by the lab.
                                                    </p>
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </ScrollArea>
                                </Tabs>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                            <div className="p-6 bg-muted rounded-full mb-4">
                                <FileText className="h-12 w-12 opacity-50" />
                            </div>
                            <p className="text-lg">Select a patient to view details</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
