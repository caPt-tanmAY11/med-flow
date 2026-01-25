"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus, Calendar, Stethoscope, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Patient {
    id: string;
    uhid: string;
    name: string;
    gender: string;
    dob: string;
    contact: string;
}

interface Doctor {
    id: string;
    name: string;
    department: string;
}

export default function PatientAssignPage() {
    const { data: session } = useSession();
    const { toast } = useToast();

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    // Form State
    const [visitType, setVisitType] = useState("OPD");
    const [department, setDepartment] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [priority, setPriority] = useState("GREEN");
    const [ward, setWard] = useState("");
    const [loading, setLoading] = useState(false);

    // OCR State
    const [file, setFile] = useState<File | null>(null);
    const [fileType, setFileType] = useState<"prescription" | "referral">("prescription");
    const [ocrText, setOcrText] = useState("");
    const [isProcessingOCR, setIsProcessingOCR] = useState(false);

    // Data State
    const [doctors, setDoctors] = useState<Doctor[]>([]);

    // Fetch doctors
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const res = await fetch("/api/doctors");
                if (res.ok) {
                    const data = await res.json();
                    setDoctors(data.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch doctors", error);
            }
        };
        fetchDoctors();
    }, []);

    // Search Patients
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchQuery.length >= 3) {
                setIsSearching(true);
                try {
                    const res = await fetch(`/api/patients/search?query=${searchQuery}`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                    }
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setSearchQuery("");
        setSuggestions([]);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);

            // Auto-process OCR
            setIsProcessingOCR(true);
            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    const base64 = event.target?.result as string;
                    const res = await fetch("/api/ocr", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ image: base64 })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            setOcrText(data.text);
                            toast({
                                title: "OCR Successful",
                                description: "Text extracted from document.",
                            });
                        }
                    }
                };
                reader.readAsDataURL(selectedFile);
            } catch (error) {
                console.error("OCR Failed", error);
                toast({
                    title: "OCR Failed",
                    description: "Could not extract text.",
                    variant: "destructive"
                });
            } finally {
                setIsProcessingOCR(false);
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedPatient) return;
        setLoading(true);

        try {
            let fileData = null;
            if (file) {
                fileData = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            }

            const res = await fetch("/api/encounters", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    patientId: selectedPatient.id,
                    type: visitType,
                    department: department,
                    primaryDoctorId: visitType === 'OPD' ? selectedDoctor : undefined,
                    triageColor: visitType === 'EMERGENCY' ? priority : undefined,
                    ward: visitType === 'IPD' ? ward : undefined,
                    fileData,
                    fileType,
                    extractedText: ocrText
                })
            });

            const result = await res.json();

            if (res.ok) {
                toast({
                    title: "Visit Created",
                    description: `Patient assigned to ${visitType} successfully.`,
                });
                // Reset form
                setSelectedPatient(null);
                setVisitType("OPD");
                setDepartment("");
                setSelectedDoctor("");
                setPriority("GREEN");
                setWard("");
                setFile(null);
                setOcrText("");
            } else {
                toast({
                    title: "Assignment Failed",
                    description: result.error || "Could not create visit",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error("Assignment error", error);
            toast({
                title: "Error",
                description: "Something went wrong.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    // Filter doctors by department
    const filteredDoctors = doctors.filter(doc => !department || doc.department === department);

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                <UserPlus className="h-8 w-8 text-primary" />
                Patient Assignment
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Search Column */}
                <div className="md:col-span-1 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Find Patient</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by UHID..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            {/* Suggestions List */}
                            {suggestions.length > 0 && (
                                <div className="border rounded-md divide-y max-h-60 overflow-y-auto bg-white shadow-sm">
                                    {suggestions.map(patient => (
                                        <div
                                            key={patient.id}
                                            className="p-3 hover:bg-muted cursor-pointer text-sm"
                                            onClick={() => handleSelectPatient(patient)}
                                        >
                                            <div className="font-medium">{patient.name}</div>
                                            <div className="text-xs text-muted-foreground">{patient.uhid}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {isSearching && <div className="text-sm text-muted-foreground text-center">Searching...</div>}
                        </CardContent>
                    </Card>

                    {selectedPatient && (
                        <Card className="bg-muted/30">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    Selected Patient
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div><span className="font-semibold">Name:</span> {selectedPatient.name}</div>
                                <div><span className="font-semibold">UHID:</span> {selectedPatient.uhid}</div>
                                <div><span className="font-semibold">Gender:</span> {selectedPatient.gender}</div>
                                <div><span className="font-semibold">DOB:</span> {new Date(selectedPatient.dob).toLocaleDateString()}</div>
                                <div><span className="font-semibold">Contact:</span> {selectedPatient.contact || "N/A"}</div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Assignment Form Column */}
                <div className="md:col-span-2">
                    <Card className={!selectedPatient ? "opacity-50 pointer-events-none" : ""}>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Visit Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Visit Type</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={visitType}
                                        onChange={(e) => setVisitType(e.target.value)}
                                    >
                                        <option value="OPD">OPD</option>
                                        <option value="IPD">IPD</option>
                                        <option value="EMERGENCY">Emergency</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Department</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                    >
                                        <option value="">Select Department</option>
                                        <option value="General Medicine">General Medicine</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="Gynecology">Gynecology</option>
                                        <option value="ENT">ENT</option>
                                    </select>
                                </div>
                            </div>

                            {visitType === 'OPD' && (
                                <div className="space-y-2 animate-in fade-in">
                                    <Label>Consulting Doctor</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={selectedDoctor}
                                        onChange={(e) => setSelectedDoctor(e.target.value)}
                                    >
                                        <option value="">Select Doctor</option>
                                        {filteredDoctors.map(doc => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.name} {doc.department ? `(${doc.department})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {visitType === 'EMERGENCY' && (
                                <div className="space-y-2 animate-in fade-in">
                                    <Label className="flex items-center gap-1 text-rose-600">
                                        <AlertTriangle className="h-4 w-4" /> Triage Priority
                                    </Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-900"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                    >
                                        <option value="RED">🔴 RED (Critical)</option>
                                        <option value="ORANGE">🟠 ORANGE (Urgent)</option>
                                        <option value="YELLOW">🟡 YELLOW (Warning)</option>
                                        <option value="GREEN">🟢 GREEN (Minor)</option>
                                    </select>
                                </div>
                            )}

                            {visitType === 'IPD' && (
                                <div className="space-y-2 animate-in fade-in">
                                    <Label>Ward Allocation</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={ward}
                                        onChange={(e) => setWard(e.target.value)}
                                    >
                                        <option value="">Select Ward</option>
                                        <option value="General ward A">General Ward A</option>
                                        <option value="General ward B">General Ward B</option>
                                        <option value="Private Room (Single)">Private Room (Single)</option>
                                        <option value="ICU">ICU</option>
                                    </select>
                                </div>
                            )}

                            {/* Document Upload Section */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-sm font-semibold flex items-center gap-2">
                                    <Stethoscope className="h-4 w-4" />
                                    Clinical Documents (Optional)
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Document Type</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            value={fileType}
                                            onChange={(e) => setFileType(e.target.value as any)}
                                        >
                                            <option value="prescription">Prescription</option>
                                            <option value="referral">Referral Note</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Upload Image</Label>
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </div>
                                </div>

                                {isProcessingOCR && (
                                    <div className="text-sm text-muted-foreground animate-pulse">
                                        Processing document with OCR...
                                    </div>
                                )}

                                {ocrText && (
                                    <div className="space-y-2">
                                        <Label>Extracted Text</Label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={ocrText}
                                            onChange={(e) => setOcrText(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="pt-4">
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={handleSubmit}
                                    disabled={loading || (visitType === 'OPD' && !selectedDoctor)}
                                >
                                    {loading ? "Assigning..." : "Confirm Assignment"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
