"use client";

import { FlaskConical, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockLabTests } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function LabPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <FlaskConical className="w-6 h-6 text-primary" />
                    Lab & Radiology
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage lab tests, results, and radiology reports
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Ordered</p>
                        <p className="text-lg font-bold">12</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <FlaskConical className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Processing</p>
                        <p className="text-lg font-bold">8</p>
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
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-status-critical animate-pulse" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Critical</p>
                        <p className="text-lg font-bold text-status-critical">3</p>
                    </div>
                </div>
            </div>

            <div className="floating-card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>UHID</th>
                            <th>Patient</th>
                            <th>Test Name</th>
                            <th>Ordered By</th>
                            <th>Priority</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockLabTests.map((test) => (
                            <tr key={test.id} className={cn(test.isCritical && "bg-status-critical/5")}>
                                <td className="font-mono text-xs">{test.uhid}</td>
                                <td className="font-medium">{test.patientName}</td>
                                <td>{test.testName}</td>
                                <td className="text-muted-foreground">{test.orderedBy}</td>
                                <td>
                                    <span className={cn(
                                        "status-badge text-xs",
                                        test.priority === 'stat' && "bg-status-critical/10 text-status-critical",
                                        test.priority === 'urgent' && "bg-status-warning/10 text-status-warning",
                                        test.priority === 'routine' && "bg-muted text-muted-foreground"
                                    )}>
                                        {test.priority}
                                    </span>
                                </td>
                                <td>
                                    <span className={cn(
                                        "status-badge text-xs",
                                        test.status === 'ordered' && "bg-muted text-muted-foreground",
                                        test.status === 'collected' && "bg-status-info/10 text-status-info",
                                        test.status === 'processing' && "bg-status-warning/10 text-status-warning",
                                        test.status === 'completed' && "bg-status-success/10 text-status-success",
                                        test.status === 'critical' && "bg-status-critical/10 text-status-critical"
                                    )}>
                                        {test.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
