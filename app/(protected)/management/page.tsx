"use client";

import { BarChart3, TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import { kpiData } from '@/data/mockData';

export default function ManagementPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Management Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Executive overview and analytics
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <DollarSign className="w-5 h-5 text-status-success" />
                        <h3 className="font-semibold">Monthly Revenue</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-success">₹{(kpiData.revenue.month / 10000000).toFixed(2)}Cr</p>
                    <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-status-info" />
                        <h3 className="font-semibold">Total Patients</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-info">1,245</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Occupancy Rate</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary">{kpiData.bedOccupancy}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Current</p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-status-warning" />
                        <h3 className="font-semibold">Surgeries</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-warning">48</p>
                    <p className="text-xs text-muted-foreground mt-1">This week</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="floating-card">
                    <h3 className="font-semibold mb-4">Revenue Breakdown</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'IPD Services', value: 45, amount: '₹56.2L' },
                            { label: 'OPD Consultations', value: 25, amount: '₹31.2L' },
                            { label: 'Diagnostics', value: 15, amount: '₹18.7L' },
                            { label: 'Pharmacy', value: 10, amount: '₹12.5L' },
                            { label: 'Others', value: 5, amount: '₹6.2L' },
                        ].map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span>{item.label}</span>
                                    <span className="font-medium">{item.amount}</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${item.value}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="floating-card">
                    <h3 className="font-semibold mb-4">Key Metrics</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Average Length of Stay</span>
                            <span className="font-bold">4.2 days</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Patient Satisfaction Score</span>
                            <span className="font-bold text-status-success">4.5/5</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Staff Efficiency Index</span>
                            <span className="font-bold">92%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Equipment Utilization</span>
                            <span className="font-bold">78%</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                            <span>Insurance Claim Success Rate</span>
                            <span className="font-bold text-status-success">94%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
