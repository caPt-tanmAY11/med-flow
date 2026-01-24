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

export default function PatientHistoryPage() {
    const { data: session } = useSession();
    const [history, setHistory] = useState<HistoryEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock fetch history
        setTimeout(() => {
            setHistory([
                {
                    id: "evt-1",
                    date: "2024-01-15",
                    type: "OPD",
                    title: "General Consultation",
                    description: "Complained of fever and headache. Prescribed antibiotics.",
                    doctor: "Dr. Sarah Smith"
                },
                {
                    id: "evt-2",
                    date: "2023-12-10",
                    type: "LAB",
                    title: "Blood Test - CBC",
                    description: "Routine checkup. All parameters normal.",
                    doctor: "Lab Technician"
                },
                {
                    id: "evt-3",
                    date: "2023-11-05",
                    type: "IPD",
                    title: "Admission - Dengue Fever",
                    description: "Admitted for 3 days. IV fluids and monitoring.",
                    doctor: "Dr. John Doe"
                }
            ]);
            setLoading(false);
        }, 1000);
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
                        ) : (
                            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                {history.map((event) => (
                                    <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        {/* Icon */}
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-primary text-slate-500 group-[.is-active]:text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                            {event.type === 'OPD' && <Activity className="h-5 w-5" />}
                                            {event.type === 'IPD' && <Activity className="h-5 w-5" />}
                                            {event.type === 'LAB' && <FileText className="h-5 w-5" />}
                                        </div>

                                        {/* Card */}
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded border border-slate-200 shadow">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-slate-900">{event.title}</div>
                                                <time className="font-caveat font-medium text-indigo-500">{new Date(event.date).toLocaleDateString()}</time>
                                            </div>
                                            <div className="text-slate-500 text-sm mb-2">{event.doctor}</div>
                                            <div className="text-slate-500">
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
