
"use client";

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Bed, Building, Layers, Calendar, UserRound } from "lucide-react";
import { format } from 'date-fns';

interface IPDDetails {
    encounterId: string;
    admissionDate: string;
    bed: {
        number: string;
        ward: string;
        floor: number;
    } | null;
    doctor: string | null;
}

export default function PatientIPDPage() {
    const [details, setDetails] = useState<IPDDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const res = await fetch('/api/patient/ipd/details');
                if (!res.ok) {
                    if (res.status === 404) {
                        // Patient record not linked or found
                        setError("Patient record not found.");
                    } else {
                        throw new Error('Failed to fetch details');
                    }
                } else {
                    const data = await res.json();
                    if (data.data) {
                        setDetails(data.data);
                    } else {
                        // No active IPD logic handled by API returning message?, checking API structure
                        // The API returns { message: 'No active IPD admission found' } if none.
                        // But wait, my API returns { data: ... } or { message: ... }
                        // I should handle 'message' key if data is missing.
                        if (data.message) {
                            setDetails(null); // No active admission
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load admission details.");
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading admission details...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                 <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6 text-center text-destructive">
                        {error}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!details) {
        return (
            <div className="p-8 space-y-6">
                <header>
                    <h1 className="text-3xl font-bold tracking-tight">My Admission</h1>
                    <p className="text-muted-foreground mt-2">Current in-patient status.</p>
                </header>
                <Card className="bg-muted/50 border-dashed">
                    <CardContent className="h-48 flex flex-col items-center justify-center text-muted-foreground">
                        <Bed className="w-10 h-10 mb-4 opacity-50" />
                        <p>You are not currently admitted to the hospital.</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
             <header>
                <h1 className="text-3xl font-bold tracking-tight">Current Admission</h1>
                <p className="text-muted-foreground mt-2">
                    Details about your current stay at MedFlow Hospital.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Bed Number</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Bed className="w-5 h-5 text-primary" />
                            {details.bed?.number || "Not Assigned"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Your assigned bed for recovery.
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Ward</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            {details.bed?.ward || "General"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            The hospital wing you are located in.
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Floor</CardDescription>
                        <CardTitle className="text-2xl flex items-center gap-2">
                            <Layers className="w-5 h-5 text-primary" />
                            {details.bed?.floor !== undefined ? `Level ${details.bed.floor}` : "N/A"}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            Floor number for visitor reference.
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="bg-card/50">
                <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                    <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Calendar className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Admission Date</p>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(details.admissionDate), 'PPP p')}
                            </p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <UserRound className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Primary Doctor</p>
                            <p className="text-sm text-muted-foreground">
                                {details.doctor || "Medical Team"}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
