"use client";

import { useEffect, useState, useCallback } from 'react';
import { Users, Clock, CheckCircle, AlertCircle, Loader2, Play, UserCheck, RefreshCw, MapPin, Stethoscope, Bell, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/lib/auth-client';

interface Doctor {
    id: string;
    name: string;
    email: string;
}

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
    waitingFor: string | null;
}

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

// Status types for patient queue flow
type PatientQueueStatus = 'WAITING' | 'CALLED' | 'IN_CONSULTATION' | 'DISCHARGED';

function getPatientQueueStatus(encounter: Encounter): PatientQueueStatus {
    if (encounter.status === 'DISCHARGED') return 'DISCHARGED';
    if (encounter.consultationStart) return 'IN_CONSULTATION';
    if (encounter.currentLocation && encounter.currentLocation !== 'Waiting Area') return 'CALLED';
    return 'WAITING';
}

export default function OPDPage() {
    const { data: session, isPending: sessionLoading } = useSession();
    const [visits, setVisits] = useState<Encounter[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { toast } = useToast();

    // Get current user role and ID
    const userRole = session?.user?.role || 'FRONT_DESK';
    const userId = session?.user?.id || '';
    const isDoctor = userRole === 'DOCTOR';
    const isPatient = userRole === 'PATIENT';
    const isStaff = ['FRONT_DESK', 'ADMIN', 'NURSE', 'NURSING_ADMIN'].includes(userRole);

    // Fetch doctors list
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch('/api/doctors');
                const result = await response.json();
                setDoctors(result.data || []);
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            }
        };
        fetchDoctors();
    }, []);

    const fetchVisits = useCallback(async () => {
        try {
            // For doctors, only fetch their assigned patients
            const params = new URLSearchParams({ type: 'OPD', status: 'ACTIVE' });
            if (isDoctor && userId) {
                params.append('doctorId', userId);
            }

            const response = await fetch(`/api/encounters?${params}`);
            const result = await response.json();
            setVisits(result.data || []);
        } catch (error) {
            console.error('Failed to fetch OPD visits:', error);
        } finally {
            setLoading(false);
        }
    }, [isDoctor, userId]);

    useEffect(() => {
        if (!sessionLoading) {
            fetchVisits();
            const interval = setInterval(fetchVisits, 15000);
            return () => clearInterval(interval);
        }
    }, [fetchVisits, sessionLoading]);

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

    // Doctor calls patient to a room (status: CALLED)
    const callPatient = async (encounterId: string, room: string) => {
        // First update the encounter
        await updateEncounter(encounterId, { currentLocation: room, waitingFor: 'Patient to arrive' });

        // Find the patient info from visits to create notification
        const visit = visits.find(v => v.id === encounterId);
        if (visit) {
            // Create notification for the patient
            // Note: We need to map patient to user ID - for now using patient ID
            // In a real system, you'd have a patient-to-user mapping
            try {
                await fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: visit.patient.id, // This should be the patient's user ID
                        title: 'You have been called!',
                        message: `Please proceed to ${room} for your consultation.`,
                        type: 'success',
                        link: '/opd',
                        encounterId: encounterId,
                        patientId: visit.patient.id,
                    }),
                });
            } catch (error) {
                console.error('Failed to create notification:', error);
            }
        }

        toast({ title: `Calling patient to ${room}`, description: 'Patient has been notified' });
    };

    // Doctor starts consultation
    const startConsultation = (id: string) => {
        updateEncounter(id, {
            consultationStart: new Date().toISOString(),
            currentLocation: 'In Consultation',
            waitingFor: null
        });
    };

    // Doctor completes consultation (removes from queue)
    const completeConsultation = (id: string) => {
        updateEncounter(id, { status: 'DISCHARGED' });
    };

    // Helper to get doctor name by ID
    const getDoctorName = (doctorId: string | null) => {
        if (!doctorId) return 'Unassigned';
        const doctor = doctors.find(d => d.id === doctorId);
        return doctor?.name || doctorId;
    };

    const waitingCount = visits.filter(v => !v.consultationStart && (!v.currentLocation || v.currentLocation === 'Waiting Area')).length;
    const calledCount = visits.filter(v => !v.consultationStart && v.currentLocation && v.currentLocation !== 'Waiting Area').length;
    const inConsultCount = visits.filter(v => v.consultationStart).length;

    if (sessionLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-2">Loading...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        {isDoctor ? 'My OPD Queue' : isPatient ? 'OPD Queue Status' : 'OPD Queue Management'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {isDoctor
                            ? 'Patients assigned to you'
                            : isPatient
                                ? 'View your queue position and status'
                                : 'Real-time outpatient queue with resource assignment'
                        }
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => fetchVisits()} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Refresh
                </Button>
            </div>

            {/* Patient notification banner - show if patient is called */}
            {isPatient && visits.some(v => getPatientQueueStatus(v) === 'CALLED') && (
                <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl flex items-center gap-3 animate-pulse">
                    <Bell className="w-6 h-6 text-status-success" />
                    <div>
                        <p className="font-semibold text-status-success">You have been called!</p>
                        <p className="text-sm">Please proceed to the assigned room.</p>
                    </div>
                </div>
            )}

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
                        <Bell className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Called</p>
                        <p className="text-2xl font-bold">{calledCount}</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">In Consultation</p>
                        <p className="text-2xl font-bold">{inConsultCount}</p>
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
                <h3 className="font-semibold mb-4 px-2 flex items-center gap-2">
                    {isPatient && <Eye className="w-4 h-4" />}
                    Current Queue
                    {isPatient && <span className="text-xs text-muted-foreground font-normal">(View Only)</span>}
                </h3>

                {loading ? (
                    <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : visits.length === 0 ? (
                    <p className="text-center text-muted-foreground p-8">
                        {isDoctor
                            ? 'No patients assigned to you. Patients will appear here once registered with you as the referring doctor.'
                            : 'No active OPD visits. Register a patient to begin.'
                        }
                    </p>
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
                                    {!isDoctor && <th className="text-left p-3">Doctor</th>}
                                    <th className="text-left p-3">Status</th>
                                    {!isPatient && <th className="text-left p-3">Actions</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {visits.map((visit, index) => {
                                    const queueStatus = getPatientQueueStatus(visit);
                                    return (
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
                                            {!isDoctor && (
                                                <td className="p-3">
                                                    <span className="text-sm font-medium">{getDoctorName(visit.primaryDoctorId)}</span>
                                                </td>
                                            )}
                                            <td className="p-3">
                                                <span className={cn(
                                                    "status-badge text-xs",
                                                    queueStatus === 'WAITING' && "bg-status-warning/10 text-status-warning",
                                                    queueStatus === 'CALLED' && "bg-status-info/10 text-status-info",
                                                    queueStatus === 'IN_CONSULTATION' && "bg-status-success/10 text-status-success"
                                                )}>
                                                    {queueStatus === 'WAITING' && 'Waiting'}
                                                    {queueStatus === 'CALLED' && 'Called'}
                                                    {queueStatus === 'IN_CONSULTATION' && 'In Consultation'}
                                                </span>
                                            </td>
                                            {!isPatient && (
                                                <td className="p-3">
                                                    <div className="flex gap-2">
                                                        {/* Doctor/Staff: Call patient to room */}
                                                        {queueStatus === 'WAITING' && (
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
                                                        {/* Doctor/Staff: Start consultation */}
                                                        {queueStatus === 'CALLED' && (
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={() => startConsultation(visit.id)}
                                                                disabled={actionLoading === visit.id}
                                                                className="gap-1 text-xs"
                                                            >
                                                                <Play className="w-3 h-3" /> Start
                                                            </Button>
                                                        )}
                                                        {/* Doctor/Staff: Complete consultation */}
                                                        {queueStatus === 'IN_CONSULTATION' && (
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
                                                        {/* Staff only: Assign doctor if not assigned */}
                                                        {isStaff && !visit.primaryDoctorId && (
                                                            <select
                                                                className="text-xs border rounded px-2 py-1 bg-background"
                                                                onChange={(e) => updateEncounter(visit.id, { primaryDoctorId: e.target.value })}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Assign Doctor...</option>
                                                                {doctors.map(d => (
                                                                    <option key={d.id} value={d.id}>{d.name}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Legend for patients */}
            {isPatient && (
                <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                    <p className="font-medium mb-2">Queue Status Legend:</p>
                    <div className="flex flex-wrap gap-4">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-status-warning"></span> Waiting</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-status-info"></span> Called - Please proceed to room</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-status-success"></span> In Consultation</span>
                    </div>
                </div>
            )}
        </div>
    );
}
