"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, FileText, Activity, Pill } from "lucide-react";

interface HistoryEvent {
    id: string;
    date: string;
    type: "OPD" | "IPD" | "LAB";
    title: string;
    description: string;
    doctor: string;
    details?: any;
}

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function PatientHistoryPage() {
    const { data: session } = useSession();
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<HistoryEvent | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await fetch("/api/patient/history");
                if (res.ok) {
                    const data = await res.json();
                    setHistory(data);
                }
            } catch (error) {
                console.error("Failed to fetch history", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case "OPD": return <UserIcon className="h-5 w-5" />;
            case "IPD": return <BedIcon className="h-5 w-5" />;
            case "LAB": return <FlaskConicalIcon className="h-5 w-5" />;
            default: return <FileText className="h-5 w-5" />;
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Medical History</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[600px] pr-4">
                        {loading ? (
                            <div className="text-center p-4">Loading history...</div>
                        ) : history.length === 0 ? (
                            <div className="text-center p-4 text-muted-foreground">No medical history found.</div>
                        ) : (
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {history.map((event) => (
                                    <div
                                        key={event.id}
                                        className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active cursor-pointer"
                                        onClick={() => setSelectedEvent(event)}
                                    >
                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            {event.type === 'OPD' && <Activity className="h-5 w-5" />}
                                            {event.type === 'IPD' && <Activity className="h-5 w-5" />}
                                            {event.type === 'LAB' && <FileText className="h-5 w-5" />}
                                        </div>

                                        {/* Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow hover:shadow-md transition-shadow bg-card">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900">{event.title}</div>
                                                <time className="font-caveat font-medium text-indigo-500">{new Date(event.date).toLocaleDateString()}</time>
                                            </div>
                                            <div className="text-slate-500 text-sm mb-2">{event.doctor}</div>
                                            <div className="text-slate-500 line-clamp-2">
                                                {event.description}
                                            </div>
                                            <div className="mt-2 flex gap-2">
                                                <Badge variant="outline">{event.type}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                        <DialogDescription>
                            {selectedEvent?.date && new Date(selectedEvent.date).toLocaleDateString()} - {selectedEvent?.doctor}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        {/* Diagnosis */}
                        <div>
                            <h3 className="font-semibold mb-2">Diagnosis</h3>
                            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                {selectedEvent?.description || "No diagnosis recorded"}
                            </p>
                        </div>

                        {/* Clinical Notes */}
                        {selectedEvent?.details?.notes && selectedEvent.details.notes.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Clinical Notes</h3>
                                <div className="space-y-2">
                                    {selectedEvent.details.notes.map((note: any) => (
                                        <div key={note.id} className="text-sm bg-muted p-3 rounded-md">
                                            <div className="font-medium text-xs text-muted-foreground mb-1">{note.noteType.toUpperCase()}</div>
                                            {note.content}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Prescriptions */}
                        {selectedEvent?.details?.prescriptions && selectedEvent.details.prescriptions.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Prescriptions</h3>
                                {selectedEvent.details.prescriptions.map((rx: any) => (
                                    <div key={rx.id} className="space-y-2">
                                        {rx.medications.map((med: any) => (
                                            <div key={med.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                                                <div>
                                                    <div className="font-medium">{med.medicationName}</div>
                                                    <div className="text-muted-foreground">{med.dosage} - {med.frequency} - {med.duration}</div>
                                                </div>
                                                {med.instructions && (
                                                    <div className="text-xs text-muted-foreground italic">{med.instructions}</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Lab Orders */}
                        {selectedEvent?.details?.orders && selectedEvent.details.orders.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Lab Orders</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {selectedEvent.details.orders.map((order: any) => (
                                        <div key={order.id} className="text-sm border p-2 rounded-md flex justify-between items-center">
                                            <span>{order.orderName}</span>
                                            <Badge variant={order.status === 'completed' ? 'default' : 'outline'}>{order.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vitals */}
                        {selectedEvent?.details?.vitals && selectedEvent.details.vitals.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Vitals Recorded</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {selectedEvent.details.vitals.map((vital: any) => (
                                        <div key={vital.id} className="contents">
                                            {vital.bpSystolic && <div className="text-sm border p-2 rounded-md text-center"><div className="text-xs text-muted-foreground">BP</div>{vital.bpSystolic}/{vital.bpDiastolic}</div>}
                                            {vital.pulse && <div className="text-sm border p-2 rounded-md text-center"><div className="text-xs text-muted-foreground">Pulse</div>{vital.pulse}</div>}
                                            {vital.temperature && <div className="text-sm border p-2 rounded-md text-center"><div className="text-xs text-muted-foreground">Temp</div>{vital.temperature}°F</div>}
                                            {vital.spO2 && <div className="text-sm border p-2 rounded-md text-center"><div className="text-xs text-muted-foreground">SpO2</div>{vital.spO2}%</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function UserIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    )
}

function BedIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 4v16" />
            <path d="M2 8h18a2 2 0 0 1 2 2v10" />
            <path d="M2 17h20" />
            <path d="M6 8v9" />
        </svg>
    )
}

function FlaskConicalIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2" />
            <path d="M8.5 2h7" />
            <path d="M7 16h10" />
        </svg>
    )
}
