"use client";

import { Users, Search, Filter, MoreVertical } from 'lucide-react';
import { mockPatients } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PatientsPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Patient List
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        View and manage all registered patients
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input placeholder="Search patients..." className="pl-10 w-64" />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                    <Button>Add Patient</Button>
                </div>
            </div>

            <div className="floating-card p-0 overflow-hidden">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>UHID</th>
                            <th>Patient Name</th>
                            <th>Age/Gender</th>
                            <th>Contact</th>
                            <th>Blood Group</th>
                            <th>Status</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockPatients.map((patient) => (
                            <tr key={patient.id}>
                                <td className="font-mono text-xs">{patient.uhid}</td>
                                <td className="font-medium">{patient.name}</td>
                                <td>{patient.age}Y / {patient.gender.charAt(0)}</td>
                                <td className="text-muted-foreground">{patient.contact}</td>
                                <td>
                                    <span className="pill-badge text-xs">{patient.bloodGroup}</span>
                                </td>
                                <td>
                                    <span className={cn(
                                        "status-badge",
                                        patient.status === 'active' && "bg-status-success/10 text-status-success",
                                        patient.status === 'discharged' && "bg-muted text-muted-foreground",
                                        patient.status === 'deceased' && "bg-status-critical/10 text-status-critical"
                                    )}>
                                        {patient.status}
                                    </span>
                                </td>
                                <td>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
