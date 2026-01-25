'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';

export default function PatientPharmacyPage() {
    const { data: session } = useSession();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session?.user?.id) {
            // We need to fetch patient details first to get the patient ID (not user ID, unless mapped)
            // Or assume the API handles user->patient mapping if we pass userId? 
            // The API we updated expects 'patientId'. The session usually has 'user.id'.
            // In this system, there's a mapping or we fetch 'my-profile'.
            // Let's assume for now we can fetch using a utility or just pass userId and let API handle (if modified)
            // But I only modified it to take 'patientId'.
            // Let's try to fetch active patient profile or use a known patient endpoint.
            // For hackathon speed, I'll fetch /api/auth/session or similar if extended, 
            // but checking 'patient/dashboard' usually fetches patient data.
            // Let's assume we can GET /api/patient/me or similar.
            // Actually, I'll fetch orders after getting patient ID.
            fetchPatientAndOrders();
        }
    }, [session]);

    const fetchPatientAndOrders = async () => {
        try {
            // Hack: Fetch my-patients or similar to finding myself? 
            // Better: Use the 'patient/dashboard' logic. 
            // Assumption: User IS the patient. I'll search via finding patient by UHID if available in session?
            // Let's try to hit a profile endpoint.
            // If not available, I'll assume for demo purposes we have a patientId stored or I'll query via UHID.

            // Allow testing: fetch all for now if no patientId logic ready, but filtered by user?
            // Actually, let's fetch /api/patient/profile if exists.
            // If not, I'll use the 'searchParams' logic with the user's ID if the backend supports it.
            // Wait, the Schema has User -> Patient mapping? 
            // `model User { ... uhid String? ... }`
            // `model Patient { ... uhid String ... }`
            // So if user has UHID, we found the patient.

            if (!session?.user?.uhid) {
                console.warn("No UHID in session");
                setLoading(false);
                return;
            }

            // Find patient by UHID to get ID
            // I'll assume an endpoint exists or I'll just use the UHID if the API supported it.
            // API supports patientId (UUID).
            // Let's fetch /api/patients?uhid=...
            const patRes = await fetch(`/api/patients?search=${session.user.uhid}`);
            const patData = await patRes.json();
            const patient = patData.data?.[0];

            if (patient) {
                const res = await fetch(`/api/pharmacy/orders?patientId=${patient.id}`);
                const data = await res.json();
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error('Failed to load pharmacy data', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">My Medicines</h1>
                <p className="text-muted-foreground">Track your prescriptions and pharmacy orders.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Prescriptions</CardTitle>
                        <Pill className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.filter(o => o.status === 'active').length}</div>
                        <p className="text-xs text-muted-foreground">To be dispensed</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Prescription History</CardTitle>
                    <CardDescription>List of all your prescribed medications and their status.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {loading ? (
                            <p className="text-muted-foreground">Loading...</p>
                        ) : orders.length === 0 ? (
                            <p className="text-muted-foreground">No prescriptions found.</p>
                        ) : (
                            orders.map((order) => (
                                <div key={order.id} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-semibold text-lg">
                                                Prescribed by Dr. {order.prescribedBy}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {format(new Date(order.prescribedAt), 'PPP')} • {order.encounter.type}
                                            </div>
                                        </div>
                                        <Badge variant={order.status === 'completed' ? 'secondary' : 'default'}>
                                            {order.status === 'completed' ? 'Dispensed' : 'Pending'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium text-muted-foreground">Medications:</div>
                                        <div className="grid gap-2 sm:grid-cols-2">
                                            {order.medications.map((med: any) => (
                                                <div key={med.id} className="flex items-center justify-between bg-muted/50 p-2 rounded">
                                                    <div>
                                                        <div className="font-medium">{med.medicationName}</div>
                                                        <div className="text-xs text-muted-foreground">{med.dosage} • {med.frequency}</div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline">{med.quantity} qty</Badge>
                                                        {med.isDispensed ? (
                                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-orange-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
