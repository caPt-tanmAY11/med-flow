"use client";

import { FileText, Search, Filter, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const auditLogs = [
    { id: 1, action: 'Patient Registration', user: 'Front Desk Staff', timestamp: '2024-01-20 09:15:00', details: 'New patient UHID-2024-000006 registered' },
    { id: 2, action: 'Prescription Created', user: 'Dr. Anil Kapoor', timestamp: '2024-01-20 09:30:00', details: 'Prescription RX001 for patient UHID-2024-000001' },
    { id: 3, action: 'Lab Test Ordered', user: 'Dr. Sneha Patel', timestamp: '2024-01-20 08:45:00', details: 'LFT ordered for patient UHID-2024-000002' },
    { id: 4, action: 'Medication Dispensed', user: 'Pharmacist Raj', timestamp: '2024-01-20 10:00:00', details: 'Prescription RX002 dispensed' },
    { id: 5, action: 'Bill Generated', user: 'Billing Staff', timestamp: '2024-01-20 10:30:00', details: 'Bill #BILL001 for ₹905' },
    { id: 6, action: 'Patient Discharged', user: 'Dr. Vikram Singh', timestamp: '2024-01-19 18:00:00', details: 'Patient UHID-2024-000010 discharged from ICU' },
    { id: 7, action: 'Bed Assignment', user: 'Nurse Priya', timestamp: '2024-01-20 07:00:00', details: 'Bed ICU-04 assigned to patient' },
    { id: 8, action: 'User Login', user: 'Admin', timestamp: '2024-01-20 06:00:00', details: 'Admin user logged in from 192.168.1.100' },
];

export default function AuditPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Audit Logs
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View system activity and audit trail
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search logs..." className="pl-10 w-64" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="floating-card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>Action</th>
                            <th>User</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {auditLogs.map((log) => (
                            <tr key={log.id}>
                                <td className="font-mono text-xs text-muted-foreground">{log.timestamp}</td>
                                <td className="font-medium">{log.action}</td>
                                <td>{log.user}</td>
                                <td className="text-muted-foreground">{log.details}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
