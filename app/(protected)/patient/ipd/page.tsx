"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bed, User, Activity, FileText, Phone } from "lucide-react";

interface AdmissionDetails {
    encounterId: string;
    admissionDate: string;
    doctorName: string;
    bedNumber: string;
    ward: string;
    diagnosis: string;
    nurseName: string;
    status: string;
}

export default function PatientIPDPage() {
    const { data: session } = useSession();
    const [admission, setAdmission] = useState<AdmissionDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch for now
        setTimeout(() => {
            setAdmission({
                encounterId: "enc-123",
                admissionDate: new Date().toISOString(),
                doctorName: "Dr. Sarah Smith",
                bedNumber: "B-104",
                ward: "General Ward - Male",
                diagnosis: "Acute Gastroenteritis",
                nurseName: "Nurse Joy",
                status: "ADMITTED"
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return <div className="p-6 text-center">Loading admission details...</div>;
    }

    if (!admission) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Not Admitted</CardTitle>
                        <CardDescription>You are not currently admitted to the hospital.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">My Admission</h1>
                <Badge className="text-lg px-3 py-1 bg-green-600">
                    {admission.status}
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Key Info Cards */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Primary Doctor
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{admission.doctorName}</div>
                        <div className="text-sm text-muted-foreground">General Medicine</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Bed className="h-4 w-4" /> Bed Location
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">Bed {admission.bedNumber}</div>
                        <div className="text-sm text-muted-foreground">{admission.ward}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Activity className="h-4 w-4" /> Assigned Nurse
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold">{admission.nurseName}</div>
                        <div className="text-sm text-muted-foreground">Shift: Morning</div>
                    </CardContent>
                </Card>

                {/* Main Details */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Admission Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm text-muted-foreground">Admission Date</div>
                                <div className="font-medium">{new Date(admission.admissionDate).toLocaleDateString()}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Diagnosis</div>
                                <div className="font-medium">{admission.diagnosis}</div>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="font-semibold mb-2">Current Medications</h3>
                            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                                <li>Paracetamol 500mg (SOS)</li>
                                <li>Pantoprazole 40mg (OD)</li>
                                <li>Ondansetron 4mg (BD)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full" variant="outline">
                            <FileText className="mr-2 h-4 w-4" /> View Reports
                        </Button>
                        <Button className="w-full" variant="outline">
                            <Activity className="mr-2 h-4 w-4" /> View Vitals
                        </Button>
                        <Button className="w-full" variant="destructive">
                            <Phone className="mr-2 h-4 w-4" /> Call Nurse
                        </Button>
                        <Button className="w-full" variant="secondary" asChild>
                            <a href="/patient/history">View Medical History</a>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
