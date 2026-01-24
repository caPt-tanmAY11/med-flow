"use client";

import { useEffect, useState, useCallback } from 'react';
import { Users, Clock, CheckCircle, AlertCircle, Loader2, Play, Phone, UserCheck, RefreshCw, MapPin, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Encounter {
    id: string;
    patient: {
        id: string;
        name: string;
        uhid: string;
        gender: string;
        dob: string;
    };
    primaryDoctorId: string | null;
    department: string | null;
    status: string;
    arrivalTime: string;
    consultationStart: string | null;
    currentLocation: string | null;
}

const DOCTORS = [
    { id: 'dr-sharma', name: 'Dr. Sharma', specialty: 'General Medicine' },
    { id: 'dr-patel', name: 'Dr. Patel', specialty: 'Orthopedics' },
    { id: 'dr-gupta', name: 'Dr. Gupta', specialty: 'Pediatrics' },
    { id: 'dr-singh', name: 'Dr. Singh', specialty: 'Cardiology' },
];

const ROOMS = ['Room 101', 'Room 102', 'Room 103', 'Room 201', 'Room 202'];

function getWaitTime(arrivalTime: string): string {
    const arrival = new Date(arrivalTime);
    const now = new Date();
    const diffMs = now.getTime() - arrival.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
}

export default function OPDPage() {
    const [visits, setVisits] = useState<Encounter[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchVisits = useCallback(async () => {
        try {
            const response = await fetch('/api/encounters?type=OPD&status=ACTIVE');
            const result = await response.json();
            setVisits(result.data || []);
        } catch (error) {
            console.error('Failed to fetch OPD visits:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVisits();
        const interval = setInterval(fetchVisits, 15000);
        return () => clearInterval(interval);
    }, [fetchVisits]);

    const updateEncounter = async (id: string, updates: Record<string, unknown>) => {
        setActionLoading(id);
        try {
            const response = await fetch(`/api/encounters/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });

            if (response.ok) {
                toast({ title: 'Updated', description: 'Patient status updated' });
                fetchVisits();
            } else {
                const error = await response.json();
                toast({ title: 'Error', description: error.error, variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
        } finally {
            setActionLoading(null);
        }
    };

    const callPatient = (id: string, room: string) => {
        updateEncounter(id, { currentLocation: room });
        toast({ title: `Calling patient to ${room}` });
    };

    const startConsultation = (id: string, doctorId: string) => {
        updateEncounter(id, {
            primaryDoctorId: doctorId,
            consultationStart: new Date().toISOString(),
            currentLocation: 'In Consultation'
        });
    };

    const completeConsultation = (id: string) => {
        updateEncounter(id, { status: 'DISCHARGED' });
    };

    const waitingCount = visits.filter(v => !v.consultationStart).length;
    const inConsultCount = visits.filter(v => v.consultationStart).length;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        OPD Queue Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Real-time outpatient queue with resource assignment
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchVisits()} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Waiting</p>
                        <p className="text-2xl font-bold">{waitingCount}</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">In Consultation</p>
                        <p className="text-2xl font-bold">{inConsultCount}</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Today Completed</p>
                        <p className="text-2xl font-bold">--</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Avg Wait</p>
                        <p className="text-2xl font-bold">
                            {visits.length > 0 ? getWaitTime(visits[visits.length - 1]?.arrivalTime) : '--'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Queue Table */}
            <div className="floating-card overflow-hidden">
                <h3 className="font-semibold mb-4 px-2">Current Queue</h3>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : visits.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8">No active OPD visits. Register a patient to begin.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-3">#</th>
                                    <th className="text-left p-3">Patient</th>
                                    <th className="text-left p-3">Department</th>
                                    <th className="text-left p-3">Wait Time</th>
                                    <th className="text-left p-3">Location</th>
                                    <th className="text-left p-3">Doctor</th>
                                    <th className="text-left p-3">Status</th>
                                    <th className="text-left p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map((visit, index) => (
                                    <tr key={visit.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                                        <td className="p-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-medium">{visit.patient.name}</p>
                                            <p className="text-xs text-muted-foreground">{visit.patient.uhid}</p>
                                        </td>
                                        <td className="p-3 text-muted-foreground">{visit.department || 'General'}</td>
                                        <td className="p-3">
                                            <span className={cn(
                                                "font-mono text-sm",
                                                parseInt(getWaitTime(visit.arrivalTime)) > 30 && "text-status-warning font-bold"
                                            )}>
                                                {getWaitTime(visit.arrivalTime)}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className="flex items-center gap-1 text-xs">
                                                <MapPin className="w-3 h-3" />
                                                {visit.currentLocation || 'Waiting Area'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            {visit.primaryDoctorId ? (
                                                <span className="text-sm font-medium">{DOCTORS.find(d => d.id === visit.primaryDoctorId)?.name || visit.primaryDoctorId}</span>
                                            ) : (
                                                <select
                                                    className="text-xs border rounded px-2 py-1 bg-background"
                                                    onChange={(e) => updateEncounter(visit.id, { primaryDoctorId: e.target.value })}
                                                    defaultValue=""
                                                >
                                                    <option value="" disabled>Assign...</option>
                                                    {DOCTORS.map(d => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td className="p-3">
                                            <span className={cn(
                                                "status-badge text-xs",
                                                !visit.consultationStart && "bg-status-warning/10 text-status-warning",
                                                visit.consultationStart && "bg-status-info/10 text-status-info"
                                            )}>
                                                {visit.consultationStart ? 'In Consultation' : 'Waiting'}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                {!visit.currentLocation && (
                                                    <select
                                                        className="text-xs border rounded px-2 py-1 bg-background"
                                                        onChange={(e) => callPatient(visit.id, e.target.value)}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>📢 Call to...</option>
                                                        {ROOMS.map(r => (
                                                            <option key={r} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                {!visit.consultationStart && visit.primaryDoctorId && (
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        onClick={() => startConsultation(visit.id, visit.primaryDoctorId!)}
                                                        disabled={actionLoading === visit.id}
                                                        className="gap-1 text-xs"
                                                    >
                                                        <Play className="w-3 h-3" /> Start
                                                    </Button>
                                                )}
                                                {visit.consultationStart && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => completeConsultation(visit.id)}
                                                        disabled={actionLoading === visit.id}
                                                        className="gap-1 text-xs text-status-success border-status-success/50"
                                                    >
                                                        <CheckCircle className="w-3 h-3" /> Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
