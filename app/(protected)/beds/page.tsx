"use client";

import { Bed } from 'lucide-react';
import { mockBeds } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function BedsPage() {
    const wards = ['ICU', 'General', 'Private'];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-status-success';
            case 'occupied': return 'bg-status-info';
            case 'reserved': return 'bg-status-warning';
            case 'cleaning': return 'bg-status-critical';
            case 'maintenance': return 'bg-muted-foreground';
            default: return 'bg-muted';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Bed className="w-6 h-6 text-primary" />
                    Bed Management
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Monitor bed availability across all wards
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-success" />
                    <span className="text-sm">Available</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-info" />
                    <span className="text-sm">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-warning" />
                    <span className="text-sm">Reserved</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-status-critical" />
                    <span className="text-sm">Cleaning</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground" />
                    <span className="text-sm">Maintenance</span>
                </div>
            </div>

            {wards.map((ward) => {
                const wardBeds = mockBeds.filter(b => b.ward === ward);
                return (
                    <div key={ward} className="floating-card">
                        <h3 className="font-semibold mb-4">{ward} Ward</h3>
                        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                            {wardBeds.map((bed) => (
                                <div
                                    key={bed.id}
                                    className={cn(
                                        "p-3 rounded-xl border text-center cursor-pointer transition-all hover:scale-105",
                                        bed.status === 'available' && "bg-status-success/10 border-status-success/30",
                                        bed.status === 'occupied' && "bg-status-info/10 border-status-info/30",
                                        bed.status === 'reserved' && "bg-status-warning/10 border-status-warning/30",
                                        bed.status === 'cleaning' && "bg-status-critical/10 border-status-critical/30",
                                        bed.status === 'maintenance' && "bg-muted border-muted-foreground/30"
                                    )}
                                >
                                    <div className="flex items-center justify-center mb-2">
                                        <Bed className={cn(
                                            "w-6 h-6",
                                            getStatusColor(bed.status).replace('bg-', 'text-')
                                        )} />
                                    </div>
                                    <p className="text-sm font-medium">{bed.number}</p>
                                    {bed.patientName && (
                                        <p className="text-xs text-muted-foreground truncate">{bed.patientName}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
