"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Clock, ArrowRight, Stethoscope } from "lucide-react";

interface QueueItem {
    id: string;
    tokenNumber: number;
    status: string;
    patient: {
        id: string;
        name: string;
        uhid: string;
        gender: string;
        dob: string;
    };
}

export default function DoctorOPDPage() {
    const { data: session } = useSession();
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [currentPatient, setCurrentPatient] = useState<QueueItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            const res = await fetch("/api/opd/queue?status=WAITING");
            if (res.ok) {
                const queueData = await res.json();
                setQueue(queueData);
            }
        } catch (error) {
            console.error("Failed to fetch queue", error);
        } finally {
            setLoading(false);
        }
    };

    const callInPatient = async (item: QueueItem) => {
        try {
            // 1. Update Queue Status
            await fetch(`/api/opd/queue`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: item.id, status: 'IN_PROGRESS' })
            });

            // 2. Find Active Encounter for this patient
            const encRes = await fetch(`/api/encounters?patientId=${item.patient.id}&type=OPD&status=ACTIVE`);
            const encData = await encRes.json();
            const encounter = encData.data?.[0];

            if (encounter) {
                // Update encounter status/location
                await fetch(`/api/encounters/${encounter.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentLocation: 'Doctor Cabin',
                        waitingFor: 'Consultation'
                    })
                });

                // Set current patient with Encounter ID for clinical actions
                setCurrentPatient({
                    ...item,
                    id: encounter.id // Swapping Queue ID with Encounter ID for the active view
                });
            } else {
                alert("No active encounter found for this patient. Please ask them to register.");
            }

            // Remove from waiting queue list locally
            setQueue(queue.filter(q => q.id !== item.id));
        } catch (error) {
            console.error("Failed to call patient", error);
        }
    };

    const endVisit = async () => {
        if (!currentPatient) return;
        try {
            // Update Encounter Status
            await fetch(`/api/encounters/${currentPatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DISCHARGED' })
            });

            // Update Queue Status (We need the Queue ID, but we swapped it. 
            // Ideally we should have kept both. But for now, let's find the queue item again or just assume it's done if we refresh)
            // Actually, we lost the Queue ID in currentPatient.id. 
            // Let's fetch the queue item by patient ID to close it.

            // Find active queue item for this patient
            // Or better, let's store queueId separately in currentPatient state.
            // But for now, let's just refresh the queue which will hide it if we filter by WAITING.
            // Wait, if we don't update OPDQueue status to COMPLETED, they might show up again if we don't filter correctly?
            // The fetchQueue filters by WAITING. So if it's IN_PROGRESS, it won't show.
            // But we should mark it COMPLETED.

            // Let's try to find the queue item to update.
            // We can fetch the queue item for this patient.
            // Or simpler: Just rely on the fact that we are done.
            // But for the Patient Status to show "COMPLETED" or remove "WAITING", we MUST update OPDQueue.

            // Let's fetch the IN_PROGRESS queue item for this patient and close it.
            // We don't have an API to find by patientId easily exposed in `queue` route (it filters by doctor).
            // But we can just fetch the queue for this doctor with status=IN_PROGRESS and find the patient.

            const qRes = await fetch(`/api/opd/queue?status=IN_PROGRESS`);
            if (qRes.ok) {
                const qData = await qRes.json();
                const qItem = qData.find((q: any) => q.patient.id === currentPatient.patient.id);
                if (qItem) {
                    await fetch(`/api/opd/queue`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id: qItem.id, status: 'COMPLETED' })
                    });
                }
            }

            setCurrentPatient(null);
            fetchQueue(); // Refresh queue
        } catch (error) {
            console.error("Failed to end visit", error);
        }
    };

    const [activeTab, setActiveTab] = useState("prescription");
    const [medicationForm, setMedicationForm] = useState({ name: "", dosage: "", frequency: "", duration: "" });
    const [vitalsForm, setVitalsForm] = useState({ bpSystolic: "", bpDiastolic: "", pulse: "", temperature: "", spO2: "" });
    const [noteContent, setNoteContent] = useState("");
    const [selectedLabTest, setSelectedLabTest] = useState("CBC");

    const saveVitals = async () => {
        if (!currentPatient) return;
        try {
            const res = await fetch("/api/vitals", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: currentPatient.id,
                    patientId: currentPatient.patient.id,
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
        if (!currentPatient) return;
        try {
            const res = await fetch("/api/clinical-notes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: currentPatient.id,
                    patientId: currentPatient.patient.id,
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
        if (!currentPatient) return;
        try {
            const res = await fetch("/api/prescriptions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: currentPatient.id,
                    patientId: currentPatient.patient.id,
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

    const prescribeLabTest = async () => {
        if (!currentPatient) return;
        try {
            // For OPD, we create an order with status 'prescribed' (or 'ordered' if immediate)
            // Using 'prescribed' to distinguish from IPD active orders if needed, 
            // but schema defaults to 'ordered'. We'll use 'ordered' for now to show up in Lab.
            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    encounterId: currentPatient.id,
                    patientId: currentPatient.patient.id,
                    orderType: "lab",
                    orderCode: selectedLabTest,
                    orderName: selectedLabTest,
                    orderedBy: session?.user?.name || "Doctor",
                    status: "ordered" // Or 'prescribed' if we want to hold it
                })
            });
            if (res.ok) {
                alert("Lab test prescribed successfully");
            }
        } catch (error) {
            console.error("Failed to prescribe lab test", error);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">OPD Dashboard</h1>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                        {session?.user?.name}
                    </Badge>
                    <Badge className="text-lg px-3 py-1 bg-green-600">
                        OPD Active
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Queue Section */}
                <Card className="md:col-span-1 h-[calc(100vh-12rem)]">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Waiting Queue</span>
                            <Badge variant="secondary">{queue.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[calc(100vh-16rem)]">
                            {loading ? (
                                <div className="p-4 text-center text-muted-foreground">Loading...</div>
                            ) : queue.length === 0 ? (
                                <div className="p-4 text-center text-muted-foreground">No patients waiting</div>
                            ) : (
                                <div className="divide-y">
                                    {queue.map((item) => (
                                        <div key={item.id} className="p-4 hover:bg-muted/50 transition-colors flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">#{item.tokenNumber}</Badge>
                                                    <span className="font-medium">{item.patient.name}</span>
                                                </div>
                                                <div className="text-sm text-muted-foreground mt-1">
                                                    {item.patient.gender}, {new Date().getFullYear() - new Date(item.patient.dob).getFullYear()}y
                                                </div>
                                            </div>
                                            <Button size="sm" onClick={() => callInPatient(item)}>
                                                Call In <ArrowRight className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Main Action Area */}
                <Card className="md:col-span-2 h-[calc(100vh-12rem)]">
                    <CardHeader>
                        <CardTitle>
                            {currentPatient ? (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <User className="h-8 w-8 text-primary" />
                                        <div>
                                            <div className="text-xl">{currentPatient.patient.name}</div>
                                            <div className="text-sm text-muted-foreground font-normal">
                                                UHID: {currentPatient.patient.uhid}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline">History</Button>
                                        <Button variant="destructive" onClick={endVisit}>End Visit</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Stethoscope className="h-5 w-5" />
                                    <span>Select a patient to start consultation</span>
                                </div>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {currentPatient ? (
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="vitals">Vitals</TabsTrigger>
                                    <TabsTrigger value="prescription">Prescription</TabsTrigger>
                                    <TabsTrigger value="notes">Clinical Notes</TabsTrigger>
                                    <TabsTrigger value="lab">Lab Orders</TabsTrigger>
                                </TabsList>
                                <TabsContent value="prescription" className="mt-4">
                                    <div className="space-y-4">
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
                                                    placeholder="e.g. BD"
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
                                        <Button className="w-full" onClick={addMedication}>Add Medication</Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="vitals" className="mt-4">
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
                                    <Button className="mt-4 w-full" onClick={saveVitals}>Save Vitals</Button>
                                </TabsContent>
                                <TabsContent value="notes" className="mt-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Clinical Notes</label>
                                            <textarea
                                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                placeholder="Patient's complaints, diagnosis, and plan..."
                                                value={noteContent}
                                                onChange={(e) => setNoteContent(e.target.value)}
                                            />
                                        </div>
                                        <Button className="w-full" onClick={saveNote}>Save Notes</Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="lab" className="mt-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Test to Prescribe</label>
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
                                        <Button className="w-full" onClick={prescribeLabTest}>Prescribe Test</Button>
                                        <p className="text-xs text-muted-foreground text-center">
                                            Note: For OPD, tests are prescribed. The patient must visit the lab/billing to confirm.
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                                <div className="p-6 bg-muted rounded-full">
                                    <User className="h-12 w-12 opacity-50" />
                                </div>
                                <p className="text-lg">Waiting for next patient...</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
