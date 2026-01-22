"use client";

import { Activity, Users, Bed, TrendingUp } from 'lucide-react';
import { kpiData } from '@/data/mockData';

export default function ResourcesPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Activity className="w-6 h-6 text-primary" />
                    Resource Utilization
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Monitor hospital resource allocation and efficiency
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Bed className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Bed Utilization</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary">{kpiData.bedOccupancy}%</p>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${kpiData.bedOccupancy}%` }} />
                    </div>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-status-info" />
                        <h3 className="font-semibold">Staff on Duty</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-info">
                        {kpiData.staffOnDuty.doctors + kpiData.staffOnDuty.nurses + kpiData.staffOnDuty.support}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {kpiData.staffOnDuty.doctors} doctors, {kpiData.staffOnDuty.nurses} nurses
                    </p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="w-5 h-5 text-status-success" />
                        <h3 className="font-semibold">OPD Efficiency</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-success">92%</p>
                    <p className="text-xs text-muted-foreground mt-1">Avg wait time: {kpiData.averageWaitTime} min</p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-status-warning" />
                        <h3 className="font-semibold">Equipment Usage</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-warning">78%</p>
                    <p className="text-xs text-muted-foreground mt-1">5 items under maintenance</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="floating-card">
                    <h3 className="font-semibold mb-4">Department Load</h3>
                    <div className="space-y-4">
                        {['Emergency', 'ICU', 'General Medicine', 'Cardiology', 'Orthopedics'].map((dept, i) => (
                            <div key={dept}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{dept}</span>
                                    <span className="text-muted-foreground">{80 - i * 10}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${80 - i * 10}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="floating-card">
                    <h3 className="font-semibold mb-4">Staff Distribution</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Doctors</span>
                            <span className="font-bold">{kpiData.staffOnDuty.doctors}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Nurses</span>
                            <span className="font-bold">{kpiData.staffOnDuty.nurses}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Support Staff</span>
                            <span className="font-bold">{kpiData.staffOnDuty.support}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
