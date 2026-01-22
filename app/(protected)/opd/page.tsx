"use client";

import { Users, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { mockVisits } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function OPDPage() {
    const opdVisits = mockVisits.filter(v => v.type === 'OPD');

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Users className="w-6 h-6 text-primary" />
                    OPD Queue
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage outpatient department queue and consultations
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Waiting</p>
                        <p className="text-lg font-bold">12</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">In Consultation</p>
                        <p className="text-lg font-bold">5</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-lg font-bold">45</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Avg Wait Time</p>
                        <p className="text-lg font-bold">18 min</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Current Queue</h3>
                <div className="space-y-3">
                    {opdVisits.map((visit, index) => (
                        <div key={visit.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                    {index + 1}
                                </div>
                                <div>
                                    <p className="font-medium">Patient #{visit.patientId}</p>
                                    <p className="text-xs text-muted-foreground">{visit.chiefComplaint}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{visit.doctor}</p>
                                <p className="text-xs text-muted-foreground">{visit.department}</p>
                            </div>
                            <span className={cn(
                                "status-badge",
                                visit.status === 'waiting' && "bg-status-warning/10 text-status-warning",
                                visit.status === 'in-consultation' && "bg-status-info/10 text-status-info"
                            )}>
                                {visit.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
