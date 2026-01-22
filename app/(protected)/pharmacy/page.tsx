"use client";

import { Pill, Clock, CheckCircle, Package } from 'lucide-react';
import { mockPrescriptions } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function PharmacyPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Pill className="w-6 h-6 text-primary" />
                    Pharmacy
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage prescriptions and medication dispensing
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-lg font-bold">15</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Dispensed Today</p>
                        <p className="text-lg font-bold">89</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-status-critical" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Low Stock Items</p>
                        <p className="text-lg font-bold text-status-critical">12</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Pending Prescriptions</h3>
                <div className="space-y-4">
                    {mockPrescriptions.map((rx) => (
                        <div key={rx.id} className="p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-medium">{rx.patientName}</p>
                                    <p className="text-xs text-muted-foreground">{rx.uhid} • {rx.prescribedBy}</p>
                                </div>
                                <span className={cn(
                                    "status-badge text-xs",
                                    rx.status === 'pending' && "bg-status-warning/10 text-status-warning",
                                    rx.status === 'dispensed' && "bg-status-success/10 text-status-success",
                                    rx.status === 'partial' && "bg-status-info/10 text-status-info"
                                )}>
                                    {rx.status}
                                </span>
                            </div>
                            <div className="space-y-2">
                                {rx.medications.map((med, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span>{med.name}</span>
                                        <span className="text-muted-foreground">{med.quantity} {med.frequency}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
