"use client";

import { Stethoscope, Calendar, Users, Clock, FileText } from 'lucide-react';
import { mockVisits, mockPatients } from '@/data/mockData';

export default function DoctorPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-primary" />
                    Doctor Dashboard
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    View appointments, patients, and clinical tasks
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold">Today&apos;s Appointments</h3>
                    </div>
                    <p className="text-3xl font-bold text-primary">8</p>
                    <p className="text-xs text-muted-foreground mt-1">3 remaining</p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <Users className="w-5 h-5 text-status-info" />
                        <h3 className="font-semibold">In-patients</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-info">12</p>
                    <p className="text-xs text-muted-foreground mt-1">Under your care</p>
                </div>
                <div className="floating-card">
                    <div className="flex items-center gap-3 mb-4">
                        <FileText className="w-5 h-5 text-status-warning" />
                        <h3 className="font-semibold">Pending Reports</h3>
                    </div>
                    <p className="text-3xl font-bold text-status-warning">5</p>
                    <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Upcoming Appointments</h3>
                <div className="space-y-3">
                    {mockVisits.slice(0, 4).map((visit, index) => (
                        <div key={visit.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium">{mockPatients.find(p => p.id === visit.patientId)?.name || 'Patient'}</p>
                                    <p className="text-xs text-muted-foreground">{visit.chiefComplaint}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-medium">{visit.department}</p>
                                <p className="text-xs text-muted-foreground">{new Date(visit.arrivalTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
