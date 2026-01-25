"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Loader2, User, X, Bed, Stethoscope, AlertTriangle, Phone, Shield, CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
    type: string;
}

interface PatientResult {
    id: string;
    uhid: string;
    name: string;
    gender: string;
    dob: string;
    contact: string | null;
    emergencyName?: string;
    emergencyContact?: string;
    emergencyRelation?: string;
}

const DEPARTMENTS = [
    "General Medicine",
    "General Surgery",
    "Orthopedics",
    "Pediatrics",
    "Gynecology",
    "Cardiology",
    "Neurology",
    "Oncology",
    "Emergency"
];

export default function RegistrationIPDPage() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);

    // Data State
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [beds, setBeds] = useState<Bed[]>([]);
    const [admissionType, setAdmissionType] = useState("IPD");

    // Form State
    const [patient, setPatient] = useState<PatientResult | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedBed, setSelectedBed] = useState("");
    const [diagnosis, setDiagnosis] = useState("");
    const [notes, setNotes] = useState("");
    const [isMLC, setIsMLC] = useState(false);
    const [autoAssignDoctor, setAutoAssignDoctor] = useState(false);

    // Emergency Contact
    const [emergencyName, setEmergencyName] = useState("");
    const [emergencyPhone, setEmergencyPhone] = useState("");
    const [emergencyRelation, setEmergencyRelation] = useState("");

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<PatientResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<NodeJS.Timeout | null>(null);

    const [loading, setLoading] = useState(false);

    // Initial Data Fetch
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [doctorsRes, bedsRes] = await Promise.all([
                    fetch('/api/doctors'),
                    fetch('/api/beds?status=AVAILABLE')
                ]);

                if (doctorsRes.ok) {
                    const data = await doctorsRes.json();
                    setDoctors(data.data || []);
                }

                if (bedsRes.ok) {
                    const data = await bedsRes.json();
                    setBeds(data.data || []);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                // Fallback for demo/dev
                setDoctors([
                    { id: "doc-1", name: "Dr. Sarah Smith", department: "Cardiology" },
                    { id: "doc-2", name: "Dr. John Doe", department: "Neurology" }
                ]);
                setBeds([
                    { id: "bed-1", bedNumber: "B-101", ward: "General Ward", status: "AVAILABLE", type: "General" },
                    { id: "bed-2", bedNumber: "B-102", ward: "General Ward", status: "AVAILABLE", type: "General" },
                    { id: "bed-3", bedNumber: "ICU-01", ward: "ICU", status: "AVAILABLE", type: "ICU" }
                ]);
            }
        };
        fetchData();
    }, []);

    // Click outside handler for search
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Search Handler
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.length < 2) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`/api/patients?query=${encodeURIComponent(value)}&limit=5`);
                if (response.ok) {
                    const data = await response.json();
                    setSearchResults(data.data || []);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error("Search error:", error);
            } finally {
                setIsSearching(false);
            }
        }, 300);
    };

    const selectPatient = (p: PatientResult) => {
        setPatient(p);
        setEmergencyName(p.emergencyName || "");
        setEmergencyPhone(p.emergencyContact || "");
        setEmergencyRelation(p.emergencyRelation || "");
        setSearchQuery("");
        setSearchResults([]);
        setShowDropdown(false);
        setStep(2);
    };

    const handleAdmission = async () => {
        // Validation
        if (!patient) {
            toast({ title: "Missing Patient", description: "Please select a patient", variant: "destructive" });
            return;
        }

        if (autoAssignDoctor && !selectedDepartment) {
            toast({ title: "Missing Department", description: "Please select a department for auto-assignment", variant: "destructive" });
            return;
        }

        if (!autoAssignDoctor && !selectedDoctor) {
            toast({ title: "Missing Doctor", description: "Please select a doctor", variant: "destructive" });
            return;
        }

        if (admissionType === "IPD" && !selectedBed) {
            toast({ title: "Missing Bed", description: "Please select a bed for IPD admission", variant: "destructive" });
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
                    department: selectedDepartment,
                    type: admissionType,
                    diagnosis,
                    notes,
                    medicoLegalFlag: isMLC,
                    autoAssignDoctor,
                    emergencyContact: {
                        name: emergencyName,
                        phone: emergencyPhone,
                        relation: emergencyRelation
                    }
                })
            });

            if (res.ok) {
                toast({
                    title: "Admission Successful",
                    description: `Patient ${patient.name} admitted to ${beds.find(b => b.id === selectedBed)?.bedNumber}`
                });
                // Reset
                setStep(1);
                setPatient(null);
                setSelectedDoctor("");
                setSelectedBed("");
                setSelectedDepartment("");
                setAdmissionType("IPD");
                setDiagnosis("");
                setNotes("");
                setIsMLC(false);
                setAutoAssignDoctor(false);
                setEmergencyName("");
                setEmergencyPhone("");
                setEmergencyRelation("");
            } else {
                const error = await res.json();
                toast({ title: "Admission Failed", description: error.error, variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const calculateAge = (dob: string) => {
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">IPD Admission</h1>
                    <p className="text-muted-foreground mt-1">Manage inpatient admissions and bed allocation</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", step >= 1 ? "bg-primary" : "bg-muted")} />
                    <div className={cn("h-1 w-8 rounded-full", step >= 2 ? "bg-primary" : "bg-muted")} />
                    <div className={cn("h-1 w-8 rounded-full", step >= 3 ? "bg-primary" : "bg-muted")} />
                    <div className={cn("h-2 w-2 rounded-full", step >= 3 ? "bg-primary" : "bg-muted")} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Progress & Info */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Patient Card */}
                    {patient ? (
                        <Card className="border-primary/20 shadow-lg bg-primary/5">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Selected Patient
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="font-bold text-xl">{patient.name}</div>
                                    <div className="text-sm text-muted-foreground font-mono">{patient.uhid}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-background/50 p-2 rounded">
                                        <span className="text-muted-foreground block text-xs">Gender</span>
                                        <span className="font-medium">{patient.gender}</span>
                                    </div>
                                    <div className="bg-background/50 p-2 rounded">
                                        <span className="text-muted-foreground block text-xs">Age</span>
                                        <span className="font-medium">{calculateAge(patient.dob)} Years</span>
                                    </div>
                                    <div className="col-span-2 bg-background/50 p-2 rounded">
                                        <span className="text-muted-foreground block text-xs">Contact</span>
                                        <span className="font-medium">{patient.contact || "N/A"}</span>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm" className="w-full" onClick={() => { setPatient(null); setStep(1); }}>
                                    Change Patient
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="pt-6 text-center text-muted-foreground">
                                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                <p>No patient selected</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Bed Status Summary */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Bed Availability</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>General Ward</span>
                                    <Badge variant="outline">{beds.filter(b => b.type === 'General').length} Available</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>ICU</span>
                                    <Badge variant="outline">{beds.filter(b => b.type === 'ICU').length} Available</Badge>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Private Room</span>
                                    <Badge variant="outline">{beds.filter(b => b.type === 'Private').length} Available</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Panel - Steps */}
                <div className="lg:col-span-2">
                    {step === 1 && (
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle>Step 1: Patient Identification</CardTitle>
                                <CardDescription>Search for an existing patient to begin admission</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div ref={searchRef} className="relative">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                        <Input
                                            placeholder="Search by Name, UHID, or Mobile Number..."
                                            value={searchQuery}
                                            onChange={(e) => handleSearchChange(e.target.value)}
                                            className="pl-10 h-12 text-lg"
                                            autoFocus
                                        />
                                        {isSearching && (
                                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
                                        )}
                                    </div>

                                    {showDropdown && searchResults.length > 0 && (
                                        <div className="absolute z-50 w-full mt-2 bg-popover border rounded-xl shadow-xl max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                                            {searchResults.map((p) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => selectPatient(p)}
                                                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3 border-b last:border-b-0"
                                                >
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                        <User className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{p.name}</div>
                                                        <div className="text-xs text-muted-foreground flex gap-2">
                                                            <span className="font-mono bg-muted px-1 rounded">{p.uhid}</span>
                                                            <span>{p.gender}, {calculateAge(p.dob)}y</span>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg flex gap-3 text-sm text-blue-700 dark:text-blue-300">
                                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    <p>
                                        Ensure you verify the patient's identity using a government ID before proceeding with admission.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle>Step 2: Clinical & Bed Details</CardTitle>
                                <CardDescription>Assign doctor, bed, and enter admission notes</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Admission Type</Label>
                                        <Select value={admissionType} onValueChange={setAdmissionType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IPD">IPD (In-Patient)</SelectItem>
                                                <SelectItem value="OPD">OPD (Out-Patient)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Admitting Department</Label>
                                        <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DEPARTMENTS.map(dept => (
                                                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Primary Consultant</Label>
                                            <div className="flex items-center gap-2">
                                                <Label htmlFor="auto-assign" className="text-xs text-muted-foreground cursor-pointer">Auto-assign</Label>
                                                <Switch id="auto-assign" checked={autoAssignDoctor} onCheckedChange={setAutoAssignDoctor} className="h-4 w-8" />
                                            </div>
                                        </div>
                                        {autoAssignDoctor ? (
                                            <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-sm text-muted-foreground flex items-center">
                                                <Stethoscope className="w-4 h-4 mr-2" />
                                                System will assign based on department
                                            </div>
                                        ) : (
                                            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Doctor" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {doctors.map(doc => (
                                                        <SelectItem key={doc.id} value={doc.id}>{doc.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    {admissionType === "IPD" && (
                                        <div className="space-y-2">
                                            <Label>Bed Allocation</Label>
                                            <Select value={selectedBed} onValueChange={setSelectedBed}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Bed" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {beds.map(bed => (
                                                        <SelectItem key={bed.id} value={bed.id}>
                                                            {bed.bedNumber} ({bed.ward}) - {bed.type}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <Label>Provisional Diagnosis</Label>
                                        <Input
                                            value={diagnosis}
                                            onChange={(e) => setDiagnosis(e.target.value)}
                                            placeholder="e.g. Acute Appendicitis"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Admission Notes</Label>
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Clinical findings, instructions..."
                                        className="min-h-[100px]"
                                    />
                                </div>

                                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <Shield className="h-5 w-5 text-orange-500" />
                                        <div>
                                            <div className="font-medium">Medico-Legal Case (MLC)</div>
                                            <div className="text-xs text-muted-foreground">Is this an accident or police case?</div>
                                        </div>
                                    </div>
                                    <Switch checked={isMLC} onCheckedChange={setIsMLC} />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                <Button onClick={() => setStep(3)}>Next: Emergency Contact</Button>
                            </CardFooter>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card className="border-0 shadow-md">
                            <CardHeader>
                                <CardTitle>Step 3: Emergency Contact & Confirmation</CardTitle>
                                <CardDescription>Verify details and complete admission</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Contact Name</Label>
                                        <Input
                                            value={emergencyName}
                                            onChange={(e) => setEmergencyName(e.target.value)}
                                            placeholder="Relative/Guardian Name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input
                                            value={emergencyPhone}
                                            onChange={(e) => setEmergencyPhone(e.target.value)}
                                            placeholder="+91..."
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <Label>Relationship</Label>
                                        <Input
                                            value={emergencyRelation}
                                            onChange={(e) => setEmergencyRelation(e.target.value)}
                                            placeholder="e.g. Father, Spouse"
                                        />
                                    </div>
                                </div>

                                <div className="bg-muted p-4 rounded-lg space-y-3 text-sm">
                                    <h4 className="font-semibold flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        Admission Summary
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        <span className="text-muted-foreground">Patient:</span>
                                        <span className="font-medium">{patient?.name}</span>

                                        <span className="text-muted-foreground">Doctor:</span>
                                        <span className="font-medium">
                                            {autoAssignDoctor ? "Auto-assigned" : doctors.find(d => d.id === selectedDoctor)?.name}
                                        </span>

                                        {admissionType === "IPD" && (
                                            <>
                                                <span className="text-muted-foreground">Bed:</span>
                                                <span className="font-medium">{beds.find(b => b.id === selectedBed)?.bedNumber}</span>
                                            </>
                                        )}

                                        <span className="text-muted-foreground">Type:</span>
                                        <span className="font-medium">{admissionType}</span>

                                        <span className="text-muted-foreground">MLC:</span>
                                        <span className={cn("font-medium", isMLC ? "text-red-600" : "text-green-600")}>
                                            {isMLC ? "YES" : "NO"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                                <Button onClick={handleAdmission} disabled={loading} size="lg" className="bg-green-600 hover:bg-green-700">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                                    Confirm Admission
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
