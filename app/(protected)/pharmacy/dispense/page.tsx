'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function DispensingQueuePage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/pharmacy/orders?status=pending');
            const data = await res.json();
            setOrders(data.data || []);
        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'all') return true;
        return order.encounter.type === filter;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dispensing Queue</h1>
                    <p className="text-muted-foreground">Select a prescription to dispense.</p>
                </div>
            </div>

            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search patient name or UHID..." className="pl-8" />
                </div>
                <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All Encounters" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Encounters</SelectItem>
                        <SelectItem value="OPD">OPD</SelectItem>
                        <SelectItem value="IPD">IPD</SelectItem>
                        <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-10">Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                            No active prescriptions found.
                        </CardContent>
                    </Card>
                ) : (
                    filteredOrders.map((order) => (
                        <Card key={order.id} className="hover:bg-muted/50 transition-colors cursor-pointer group" onClick={() => router.push(`/pharmacy/dispense/${order.id}`)}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{order.patient.name}</h3>
                                        <Badge variant={order.encounter.type === 'EMERGENCY' ? 'destructive' : 'secondary'}>
                                            {order.encounter.type}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground ml-2">UHID: {order.patient.uhid}</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Dr. {order.prescribedBy || 'Unknown'} • {format(new Date(order.prescribedAt), 'MMM d, yyyy h:mm a')}
                                    </p>
                                    <div className="flex gap-2 mt-2">
                                        {order.medications.slice(0, 3).map((m: any, i: number) => (
                                            <Badge key={i} variant="outline" className="text-xs">
                                                {m.medicationName} ({m.quantity})
                                            </Badge>
                                        ))}
                                        {order.medications.length > 3 && (
                                            <span className="text-xs text-muted-foreground">+{order.medications.length - 3} more</span>
                                        )}
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
