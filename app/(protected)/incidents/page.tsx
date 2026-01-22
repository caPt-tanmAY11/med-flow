"use client";

import { AlertTriangle, Clock, CheckCircle, Search } from 'lucide-react';
import { mockIncidents } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

export default function IncidentsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <AlertTriangle className="w-6 h-6 text-status-warning" />
                        Risk & Incidents
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Report and track safety incidents
                    </p>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search incidents..." className="pl-10 w-64" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-status-critical" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Critical</p>
                        <p className="text-lg font-bold text-status-critical">2</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Investigating</p>
                        <p className="text-lg font-bold">5</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Resolved</p>
                        <p className="text-lg font-bold">28</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">This Month</p>
                        <p className="text-lg font-bold">12</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Recent Incidents</h3>
                <div className="space-y-4">
                    {mockIncidents.map((incident) => (
                        <div key={incident.id} className="p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "w-3 h-3 rounded-full",
                                        incident.severity === 'critical' && "bg-status-critical",
                                        incident.severity === 'high' && "bg-orange-500",
                                        incident.severity === 'medium' && "bg-status-warning",
                                        incident.severity === 'low' && "bg-status-success"
                                    )} />
                                    <span className="font-medium capitalize">{incident.type.replace('-', ' ')}</span>
                                </div>
                                <span className={cn(
                                    "status-badge text-xs",
                                    incident.status === 'reported' && "bg-status-warning/10 text-status-warning",
                                    incident.status === 'investigating' && "bg-status-info/10 text-status-info",
                                    incident.status === 'resolved' && "bg-status-success/10 text-status-success",
                                    incident.status === 'closed' && "bg-muted text-muted-foreground"
                                )}>
                                    {incident.status}
                                </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Location: {incident.location}</span>
                                <span>Reported by: {incident.reportedBy}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
