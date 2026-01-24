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
            // Fetch active OPD encounters assigned to this doctor (or all if no doctorId filter)
            // In a real app, we'd filter by doctorId=session.user.id
            const res = await fetch("/api/encounters?type=OPD&status=ACTIVE");
            if (res.ok) {
                const result = await res.json();
                // Map Encounter to QueueItem
                const encounters = result.data || [];
                const mappedQueue = encounters.map((enc: any, index: number) => ({
                    id: enc.id,
                    tokenNumber: index + 1, // Use index as token number for now
                    status: enc.status,
                    patient: enc.patient
                }));
                setQueue(mappedQueue);
            }
        } catch (error) {
            console.error("Failed to fetch queue", error);
        } finally {
            setLoading(false);
        }
    };

    const callInPatient = async (item: QueueItem) => {
        try {
            // Update encounter status/location
            await fetch(`/api/encounters/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentLocation: 'Doctor Cabin',
                    waitingFor: 'Consultation'
                })
            });

            setCurrentPatient(item);
            // Remove from waiting queue
            setQueue(queue.filter(q => q.id !== item.id));
        } catch (error) {
            console.error("Failed to call patient", error);
        }
    };

    const endVisit = async () => {
        if (!currentPatient) return;
        try {
            await fetch(`/api/encounters/${currentPatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'DISCHARGED' })
            });
            setCurrentPatient(null);
            fetchQueue(); // Refresh queue
        } catch (error) {
            console.error("Failed to end visit", error);
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
                            <Tabs defaultValue="prescription" className="w-full">
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
                                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. Paracetamol" />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Dosage & Frequency</label>
                                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="e.g. 500mg BD x 5 days" />
                                            </div>
                                        </div>
                                        <Button className="w-full">Add Medication</Button>

                                        <div className="border rounded-md p-4 mt-4">
                                            <h4 className="font-medium mb-2">Current Prescription</h4>
                                            <ul className="list-disc list-inside text-sm text-muted-foreground">
                                                <li>Amoxicillin 500mg TDS x 5 days</li>
                                            </ul>
                                        </div>
                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button variant="outline">Print Prescription</Button>
                                            <Button variant="secondary">Suggest IPD Admission</Button>
                                        </div>
                                    </div>
                                </TabsContent>
                                <TabsContent value="vitals" className="mt-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">BP (Systolic/Diastolic)</label>
                                            <div className="flex gap-2">
                                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="120" />
                                                <span className="self-center">/</span>
                                                <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="80" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Pulse (bpm)</label>
                                            <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="72" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Temperature (°F)</label>
                                            <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="98.6" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">SpO2 (%)</label>
                                            <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="98" />
                                        </div>
                                    </div>
                                    <Button className="mt-4 w-full">Save Vitals</Button>
                                </TabsContent>
                                <TabsContent value="notes" className="mt-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Chief Complaint</label>
                                            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" placeholder="Patient's main complaint..." />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Diagnosis</label>
                                            <input className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Provisional diagnosis" />
                                        </div>
                                        <Button className="w-full">Save Notes</Button>
                                    </div>
                                </TabsContent>
                                <TabsContent value="lab" className="mt-4">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Select Test</label>
                                            <select className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                                                <option>CBC</option>
                                                <option>Lipid Profile</option>
                                                <option>Liver Function Test</option>
                                                <option>X-Ray Chest PA</option>
                                            </select>
                                        </div>
                                        <Button className="w-full">Order Test</Button>
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
