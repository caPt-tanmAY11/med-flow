"use client";

import { Ambulance, AlertTriangle, Clock, Users } from 'lucide-react';
import { mockVisits } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function EmergencyPage() {
    const emergencyVisits = mockVisits.filter(v => v.type === 'Emergency');

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Ambulance className="w-6 h-6 text-status-critical" />
                    Emergency Department
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage emergency cases and triage
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card border-l-4 border-l-status-critical flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-status-critical animate-pulse" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Immediate</p>
                        <p className="text-lg font-bold text-status-critical">2</p>
                    </div>
                </div>
                <div className="kpi-card border-l-4 border-l-orange-500 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Urgent</p>
                        <p className="text-lg font-bold text-orange-500">5</p>
                    </div>
                </div>
                <div className="kpi-card border-l-4 border-l-status-warning flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Delayed</p>
                        <p className="text-lg font-bold text-status-warning">8</p>
                    </div>
                </div>
                <div className="kpi-card border-l-4 border-l-status-success flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Minor</p>
                        <p className="text-lg font-bold text-status-success">12</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Active Emergency Cases</h3>
                <div className="space-y-3">
                    {emergencyVisits.map((visit) => (
                        <div key={visit.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border-l-4 border-l-status-critical">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "triage-badge",
                                    visit.triageLevel === 'immediate' && "bg-status-critical",
                                    visit.triageLevel === 'urgent' && "bg-orange-500",
                                    visit.triageLevel === 'delayed' && "bg-status-warning",
                                    visit.triageLevel === 'minor' && "bg-status-success"
                                )}>
                                    {visit.triageLevel?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-medium">Patient #{visit.patientId}</p>
                                    <p className="text-xs text-muted-foreground">{visit.chiefComplaint}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{visit.doctor}</p>
                                <p className="text-xs text-muted-foreground capitalize">{visit.status}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
