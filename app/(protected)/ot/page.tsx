"use client";

import { useEffect, useState } from 'react';
import { Scissors, Calendar, RefreshCw, Loader2, Clock, CheckCircle, PlayCircle, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Surgery {
    id: string;
    procedureName: string;
    scheduledDate: string;
    scheduledTime: string;
    estimatedDuration: number;
    status: string;
    otRoom: string;
    surgeryTeam: { staffName: string; role: string }[];
    encounter: { patient: { uhid: string; name: string; gender: string; dob: string } };
}

export default function OTPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [surgeries, setSurgeries] = useState<Surgery[]>([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedSurgery, setSelectedSurgery] = useState<Surgery | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchSurgeries = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/surgeries?date=${selectedDate}`);
            const result = await response.json();
            setSurgeries(result.data || []);
        } catch (error) {
            console.error('Failed to fetch surgeries:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSurgeries(); }, [selectedDate]);

    const handleUpdateStatus = async (surgeryId: string, newStatus: string) => {
        setSaving(true);
        try {
            const response = await fetch(`/api/surgeries/${surgeryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Surgery marked as ${newStatus}` });
                setShowDetailsModal(false);
                setSelectedSurgery(null);
                fetchSurgeries();
            } else {
                toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update surgery', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const openDetails = (surgery: Surgery) => { setSelectedSurgery(surgery); setShowDetailsModal(true); };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; icon: React.ElementType }> = {
            scheduled: { bg: 'bg-blue-100 text-blue-700', icon: Calendar },
            'in-progress': { bg: 'bg-status-warning text-white', icon: PlayCircle },
            completed: { bg: 'bg-status-success/10 text-status-success', icon: CheckCircle },
            cancelled: { bg: 'bg-gray-100 text-gray-500', icon: Clock },
            delayed: { bg: 'bg-status-critical/10 text-status-critical', icon: Clock },
        };
        return styles[status] || styles.scheduled;
    };

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const otRooms = [...new Set(surgeries.map(s => s.otRoom))];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Scissors className="w-6 h-6 text-primary" />Operation Theatre</h1><p className="text-sm text-muted-foreground mt-1">Surgery schedule and management</p></div>
                <div className="flex gap-2">
                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="elegant-select" />
                    <Button variant="outline" size="sm" onClick={fetchSurgeries}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="kpi-card"><p className="text-xs text-muted-foreground">Total Surgeries</p><p className="text-2xl font-bold">{surgeries.length}</p></div>
                <div className="kpi-card border-l-4 border-l-blue-500"><p className="text-xs text-muted-foreground">Scheduled</p><p className="text-2xl font-bold">{surgeries.filter(s => s.status === 'scheduled').length}</p></div>
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">In Progress</p><p className="text-2xl font-bold">{surgeries.filter(s => s.status === 'in-progress').length}</p></div>
                <div className="kpi-card border-l-4 border-l-status-success"><p className="text-xs text-muted-foreground">Completed</p><p className="text-2xl font-bold">{surgeries.filter(s => s.status === 'completed').length}</p></div>
            </div>

            {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : surgeries.length === 0 ? (
                <div className="floating-card text-center py-12"><Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">No surgeries scheduled for this date</p></div>
            ) : (
                <div className="space-y-6">
                    {otRooms.map((room) => (
                        <div key={room} className="floating-card">
                            <h3 className="font-semibold mb-4 flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">{room}</div>OT Room {room}</h3>
                            <div className="space-y-3">
                                {surgeries.filter(s => s.otRoom === room).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime)).map((surgery) => {
                                    const status = getStatusBadge(surgery.status);
                                    return (
                                        <div key={surgery.id} onClick={() => openDetails(surgery)} className={cn("flex items-center justify-between p-4 rounded-xl border cursor-pointer hover:bg-muted/50 transition-colors", surgery.status === 'in-progress' && "bg-status-warning/5 border-status-warning")}>
                                            <div className="flex items-center gap-4">
                                                <div className="text-center"><p className="text-xl font-bold">{surgery.scheduledTime}</p><p className="text-xs text-muted-foreground">{surgery.estimatedDuration} min</p></div>
                                                <div><p className="font-medium">{surgery.procedureName}</p><p className="text-sm text-muted-foreground">{surgery.encounter.patient.name} ({surgery.encounter.patient.uhid}) • {getAge(surgery.encounter.patient.dob)}y {surgery.encounter.patient.gender.charAt(0)}</p></div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex -space-x-2">{surgery.surgeryTeam.slice(0, 3).map((member, idx) => (<div key={idx} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs font-medium" title={`${member.staffName} (${member.role})`}>{member.staffName.charAt(0)}</div>))}{surgery.surgeryTeam.length > 3 && <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border-2 border-background text-xs">+{surgery.surgeryTeam.length - 3}</div>}</div>
                                                <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1", status.bg)}><status.icon className="w-3 h-3" />{surgery.status}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Surgery Details Modal */}
            {showDetailsModal && selectedSurgery && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-lg w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Surgery Details</h2><Button variant="ghost" size="sm" onClick={() => { setShowDetailsModal(false); setSelectedSurgery(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between"><span className="text-muted-foreground">Procedure</span><span className="font-medium">{selectedSurgery.procedureName}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{selectedSurgery.encounter.patient.name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">UHID</span><span>{selectedSurgery.encounter.patient.uhid}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">OT Room</span><span>{selectedSurgery.otRoom}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span>{selectedSurgery.scheduledTime} ({selectedSurgery.estimatedDuration} min)</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(selectedSurgery.status).bg)}>{selectedSurgery.status}</span></div>
                        </div>
                        {selectedSurgery.surgeryTeam.length > 0 && (<div className="mb-4"><h4 className="font-medium mb-2">Surgical Team</h4><div className="space-y-1">{selectedSurgery.surgeryTeam.map((m, i) => (<div key={i} className="flex justify-between text-sm p-2 bg-muted/30 rounded"><span>{m.staffName}</span><span className="text-muted-foreground capitalize">{m.role}</span></div>))}</div></div>)}
                        <div className="mb-4"><Label className="text-sm mb-2 block">Update Status</Label><div className="grid grid-cols-2 gap-2">
                            <Button size="sm" variant="outline" className="bg-status-warning/10 border-status-warning text-status-warning" disabled={selectedSurgery.status === 'in-progress' || saving} onClick={() => handleUpdateStatus(selectedSurgery.id, 'in-progress')}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Surgery'}</Button>
                            <Button size="sm" variant="outline" className="bg-status-success/10 border-status-success text-status-success" disabled={selectedSurgery.status === 'completed' || saving} onClick={() => handleUpdateStatus(selectedSurgery.id, 'completed')}>{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete'}</Button>
                            <Button size="sm" variant="outline" className="bg-status-critical/10 border-status-critical text-status-critical" disabled={selectedSurgery.status === 'delayed' || saving} onClick={() => handleUpdateStatus(selectedSurgery.id, 'delayed')}>Delayed</Button>
                            <Button size="sm" variant="outline" className="bg-gray-100 border-gray-400 text-gray-600" disabled={selectedSurgery.status === 'cancelled' || saving} onClick={() => handleUpdateStatus(selectedSurgery.id, 'cancelled')}>Cancel</Button>
                        </div></div>
                        <div className="flex justify-end"><Button variant="outline" onClick={() => { setShowDetailsModal(false); setSelectedSurgery(null); }}>Close</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
