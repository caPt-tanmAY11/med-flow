"use client";

import { Syringe, Clock, CheckCircle, Calendar } from 'lucide-react';
import { mockSurgeries } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function OTPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Syringe className="w-6 h-6 text-primary" />
                    Operation Theatre
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Schedule and manage surgical procedures
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Scheduled Today</p>
                        <p className="text-lg font-bold">4</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                        <p className="text-lg font-bold">1</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-lg font-bold">12</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Syringe className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Available OT Rooms</p>
                        <p className="text-lg font-bold">3/5</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Today&apos;s Schedule</h3>
                <div className="space-y-4">
                    {mockSurgeries.map((surgery) => (
                        <div key={surgery.id} className="p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-medium">{surgery.procedure}</p>
                                    <p className="text-xs text-muted-foreground">{surgery.patientName} • {surgery.uhid}</p>
                                </div>
                                <span className={cn(
                                    "status-badge text-xs",
                                    surgery.status === 'scheduled' && "bg-status-info/10 text-status-info",
                                    surgery.status === 'in-progress' && "bg-status-warning/10 text-status-warning",
                                    surgery.status === 'completed' && "bg-status-success/10 text-status-success",
                                    surgery.status === 'cancelled' && "bg-status-critical/10 text-status-critical"
                                )}>
                                    {surgery.status}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Surgeon</p>
                                    <p className="font-medium">{surgery.surgeon}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Anesthetist</p>
                                    <p className="font-medium">{surgery.anesthetist}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">OT Room</p>
                                    <p className="font-medium">{surgery.otRoom}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Time</p>
                                    <p className="font-medium">{surgery.scheduledTime}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
