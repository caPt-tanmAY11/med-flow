"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, MapPin, Calendar } from "lucide-react";

interface QueueStatus {
    myToken: number;
    currentToken: number;
    estimatedWaitTime: number; // in minutes
    doctorName: string;
    department: string;
    status: string;
}

export default function PatientOPDPage() {
    const { data: session } = useSession();
    const [status, setStatus] = useState<QueueStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch for now, replace with actual API call
        // In real app, we'd fetch /api/patient/opd/status
        setTimeout(() => {
            setStatus({
                myToken: 12,
                currentToken: 5,
                estimatedWaitTime: 35,
                doctorName: "Dr. Sarah Smith",
                department: "Cardiology",
                status: "WAITING"
            });
            setLoading(false);
        }, 1000);
    }, []);

    if (loading) {
        return <div className="p-6 text-center">Loading status...</div>;
    }

    if (!status) {
        return (
            <div className="p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>No Active Appointments</CardTitle>
                        <CardDescription>You don't have any scheduled OPD visits today.</CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">OPD Live Status</h1>

            {/* Main Status Card */}
            <Card className="border-primary/20 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <CardTitle className="text-lg text-muted-foreground">Your Token Number</CardTitle>
                    <div className="text-6xl font-bold text-primary mt-2">#{status.myToken}</div>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="flex justify-center gap-2">
                        <Badge variant={status.status === 'WAITING' ? 'secondary' : 'default'} className="text-lg px-4 py-1">
                            {status.status}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-6">
                        <div className="text-center">
                            <div className="text-sm text-muted-foreground mb-1">Current Token</div>
                            <div className="text-3xl font-semibold">#{status.currentToken}</div>
                        </div>
                        <div className="text-center border-l">
                            <div className="text-sm text-muted-foreground mb-1">Est. Wait Time</div>
                            <div className="text-3xl font-semibold flex items-center justify-center gap-2">
                                <Clock className="h-6 w-6 text-orange-500" />
                                {status.estimatedWaitTime} <span className="text-sm font-normal">min</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Doctor Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Doctor Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center border-b pb-3">
                        <span className="text-muted-foreground">Doctor</span>
                        <span className="font-medium">{status.doctorName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-3">
                        <span className="text-muted-foreground">Department</span>
                        <span className="font-medium">{status.department}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium flex items-center gap-1">
                            <MapPin className="h-4 w-4" /> Room 304, 3rd Floor
                        </span>
                    </div>
                </CardContent>
            </Card>

            <div className="text-center text-sm text-muted-foreground">
                Please be present near the consultation room 10 minutes before your turn.
            </div>

            <div className="flex justify-center">
                <Button variant="link" asChild>
                    <a href="/patient/history">View Medical History</a>
                </Button>
            </div>
        </div>
    );
}
