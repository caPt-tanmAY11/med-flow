
"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/context/AuthContext';
import { Activity, CalendarDays, HeartPulse } from 'lucide-react';
import Link from 'next/link';

export default function PatientDashboard() {
    const { user } = useAuth();

    return (
        <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name || "Patient"}</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your health and hospital visits from your personal dashboard.
                </p>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
                 <Link href="/patient/ipd" className="block group">
                    <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                                <Activity className="w-5 h-5" />
                                Active Admission
                            </CardTitle>
                            <CardDescription>
                                View details about your current hospital stay.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="text-sm font-medium text-primary">Check status →</div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="opacity-60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarDays className="w-5 h-5" />
                            Appointments
                        </CardTitle>
                        <CardDescription>
                            Upcoming OPD visits and consultations.
                        </CardDescription>
                    </CardHeader>
                     <CardContent>
                        <div className="text-sm">Coming Soon</div>
                    </CardContent>
                </Card>

                 <Card className="opacity-60">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HeartPulse className="w-5 h-5" />
                            Vitals History
                        </CardTitle>
                        <CardDescription>
                            Track your health metrics over time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">Coming Soon</div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
