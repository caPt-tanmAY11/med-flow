"use client";

import { Shield, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockBills } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function InsurancePage() {
    const insuranceBills = mockBills.filter(b => b.insuranceClaim);

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Shield className="w-6 h-6 text-primary" />
                    Insurance Claims
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage insurance claims and approvals
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="text-lg font-bold">8</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Approved</p>
                        <p className="text-lg font-bold">42</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-status-critical" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Rejected</p>
                        <p className="text-lg font-bold">3</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Active Claims</h3>
                {insuranceBills.map((bill) => (
                    <div key={bill.id} className="p-4 bg-muted/30 rounded-xl mb-3">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="font-medium">{bill.patientName}</p>
                                <p className="text-xs text-muted-foreground">{bill.insuranceClaim?.provider}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-bold">₹{bill.insuranceClaim?.claimAmount.toLocaleString()}</p>
                                <span className={cn(
                                    "status-badge text-xs",
                                    bill.insuranceClaim?.status === 'pending' && "bg-status-warning/10 text-status-warning",
                                    bill.insuranceClaim?.status === 'submitted' && "bg-status-info/10 text-status-info",
                                    bill.insuranceClaim?.status === 'approved' && "bg-status-success/10 text-status-success",
                                    bill.insuranceClaim?.status === 'rejected' && "bg-status-critical/10 text-status-critical"
                                )}>
                                    {bill.insuranceClaim?.status}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Policy: {bill.insuranceClaim?.policyNumber} • Total Bill: ₹{bill.total.toLocaleString()}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
