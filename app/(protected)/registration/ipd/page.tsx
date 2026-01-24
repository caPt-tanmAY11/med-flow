"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface Doctor {
    id: string;
    name: string;
    department: string;
}

interface Bed {
    id: string;
    bedNumber: string;
    ward: string;
    status: string;
}

export default function RegistrationIPDPage() {
    const { toast } = useToast();
    const [uhid, setUhid] = useState("");
    const [patient, setPatient] = useState<any>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [beds, setBeds] = useState<Bed[]>([]);

    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedBed, setSelectedBed] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Mock fetch doctors and beds
        // In real app: fetch /api/doctors and /api/beds?status=AVAILABLE
        setDoctors([
            { id: "doc-1", name: "Dr. Sarah Smith", department: "Cardiology" },
            { id: "doc-2", name: "Dr. John Doe", department: "Neurology" }
        ]);
        setBeds([
            { id: "bed-1", bedNumber: "B-101", ward: "General Ward", status: "AVAILABLE" },
            { id: "bed-2", bedNumber: "B-102", ward: "General Ward", status: "AVAILABLE" }
        ]);
    }, []);

    const searchPatient = async () => {
        // Mock patient search
        if (uhid === "123456") {
            setPatient({ id: "pat-1", name: "Jane Doe", age: 45, gender: "Female" });
        } else {
            toast({ title: "Patient not found", variant: "destructive" });
            setPatient(null);
        }
    };

    const handleAdmission = async () => {
        if (!patient || !selectedDoctor || !selectedBed) {
            toast({ title: "Please fill all fields", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/ipd/admission", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: patient.id,
                    doctorId: selectedDoctor,
                    bedId: selectedBed,
                    diagnosis,
                    notes
                })
            });

            if (res.ok) {
                toast({ title: "Patient Admitted Successfully" });
                // Reset form
                setPatient(null);
                setUhid("");
                setSelectedDoctor("");
                setSelectedBed("");
                setDiagnosis("");
                setNotes("");
            } else {
                const error = await res.json();
                toast({ title: "Admission Failed", description: error.error, variant: "destructive" });
            }
        } catch (error) {
            console.error("Admission error", error);
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">IPD Admission</h1>

            {/* Patient Search */}
            <Card>
                <CardHeader>
                    <CardTitle>1. Select Patient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <Label htmlFor="uhid">UHID / Phone</Label>
                            <Input
                                id="uhid"
                                placeholder="Enter UHID or Phone Number"
                                value={uhid}
                                onChange={(e) => setUhid(e.target.value)}
                            />
                        </div>
                        <Button className="mt-6" onClick={searchPatient}>Search</Button>
                    </div>

                    {patient && (
                        <div className="p-4 bg-muted rounded-md flex justify-between items-center">
                            <div>
                                <div className="font-bold text-lg">{patient.name}</div>
                                <div className="text-sm text-muted-foreground">{patient.gender}, {patient.age} years</div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => setPatient(null)}>Change</Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Admission Details */}
            <Card className={!patient ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader>
                    <CardTitle>2. Admission Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Primary Doctor</Label>
                            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Doctor" />
                                </SelectTrigger>
                                <SelectContent>
                                    {doctors.map(doc => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.name} ({doc.department})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Bed Allocation</Label>
                            <Select value={selectedBed} onValueChange={setSelectedBed}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select Bed" />
                                </SelectTrigger>
                                <SelectContent>
                                    {beds.map(bed => (
                                        <SelectItem key={bed.id} value={bed.id}>
                                            {bed.bedNumber} - {bed.ward}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Provisional Diagnosis</Label>
                        <Input
                            placeholder="Enter diagnosis"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Admission Notes</Label>
                        <Textarea
                            placeholder="Any specific instructions or notes..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    <Button className="w-full" size="lg" onClick={handleAdmission} disabled={loading}>
                        {loading ? "Processing..." : "Admit Patient"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
