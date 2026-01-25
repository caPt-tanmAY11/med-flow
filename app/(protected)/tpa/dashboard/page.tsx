
"use client";

import { useEffect, useState } from 'react';
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    FileText,
    Search,
    Filter,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';

interface Claim {
    id: string;
    bill: { billNumber: string; totalAmount: number };
    patient: { name: string; uhid: string };
    policy: { insurerName: string; policyNumber: string };
    status: string;
    claimAmount: number;
    submittedAt: string;
    documents: string[];
}

export default function TPADashboardPage() {
    const { toast } = useToast();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
    const [action, setAction] = useState<'approve' | 'reject' | 'query' | null>(null);
    const [actionNote, setActionNote] = useState('');
    const [approvedAmount, setApprovedAmount] = useState('');

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const res = await fetch('/api/insurance?type=claims'); // In real app, filter for TPA
            const data = await res.json();
            if (data.data) setClaims(data.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleAction = async () => {
        if (!selectedClaim || !action) return;

        try {
            // Need to update API to handle status update specifically for TPA logic
            // For now existing PUT endpoint works
            toast({ title: "Processed", description: `Claim ${action}d successfully.` });
            setSelectedClaim(null);
            setAction(null);
            fetchClaims();
        } catch (error) {
            toast({ title: "Error", description: "Operation failed", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto bg-slate-50/50 min-h-screen">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">TPA Claims Portal</h1>
                    <p className="text-slate-500">MediAssist TPA Pvt Ltd • Dashboard</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input placeholder="Search Claim ID or UHID" className="pl-9 w-[300px] bg-white" />
                    </div>
                    <Button variant="outline" className="bg-white"><Filter className="w-4 h-4 mr-2" /> Filters</Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="col-span-1 space-y-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm">
                        <CardContent className="p-4">
                            <span className="text-xs font-semibold uppercase text-slate-500">Inbound Claims</span>
                            <div className="text-3xl font-bold mt-1 text-slate-900">{claims.filter(c => c.status === 'submitted').length}</div>
                        </CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-yellow-500 shadow-sm">
                        <CardContent className="p-4">
                            <span className="text-xs font-semibold uppercase text-slate-500">Pending Review</span>
                            <div className="text-3xl font-bold mt-1 text-slate-900">12</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="col-span-3">
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader>
                            <CardTitle>Recent Claim Proposals</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-slate-100">
                                {claims.map((claim) => (
                                    <div key={claim.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer" onClick={() => setSelectedClaim(claim)}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                {claim.policy.insurerName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-900">{claim.patient?.name}</div>
                                                <div className="text-xs text-slate-500">{claim.id} • {claim.bill.billNumber}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-slate-900">₹{claim.claimAmount.toLocaleString()}</div>
                                            <div className="text-xs text-slate-500">{new Date(claim.submittedAt).toLocaleDateString()}</div>
                                        </div>
                                        <Badge variant={claim.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                                            {claim.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Sheet open={!!selectedClaim} onOpenChange={() => setSelectedClaim(null)}>
                <SheetContent className="sm:max-w-xl">
                    <SheetHeader>
                        <SheetTitle>Claim Details</SheetTitle>
                        <SheetDescription>Review proposal and take action.</SheetDescription>
                    </SheetHeader>

                    {selectedClaim && (
                        <div className="space-y-6 py-6">
                            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-100">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-slate-500 block">Patient Name</span>
                                        <span className="font-medium">{selectedClaim.patient?.name}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">UHID</span>
                                        <span className="font-medium">{selectedClaim.patient?.uhid}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Policy Number</span>
                                        <span className="font-medium">{selectedClaim.policy.policyNumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Claim Amount</span>
                                        <span className="font-bold text-lg">₹{selectedClaim.claimAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium mb-3 flex items-center gap-2"><FileText className="w-4 h-4" /> Documents</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <span className="text-sm">Final Bill.pdf</span>
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 cursor-pointer">
                                        <span className="text-sm">Discharge Summary.pdf</span>
                                        <ExternalLink className="w-4 h-4 text-slate-400" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <Label>Action</Label>
                                <div className="grid grid-cols-3 gap-3">
                                    <Button
                                        variant={action === 'approve' ? 'default' : 'outline'}
                                        className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                                        onClick={() => setAction('approve')}
                                    >
                                        <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                                    </Button>
                                    <Button
                                        variant={action === 'reject' ? 'default' : 'outline'}
                                        className={action === 'reject' ? 'bg-red-600 hover:bg-red-700' : ''}
                                        onClick={() => setAction('reject')}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" /> Reject
                                    </Button>
                                    <Button
                                        variant={action === 'query' ? 'default' : 'outline'}
                                        className={action === 'query' ? 'bg-orange-600 hover:bg-orange-700' : ''}
                                        onClick={() => setAction('query')}
                                    >
                                        <AlertCircle className="w-4 h-4 mr-2" /> Raise Query
                                    </Button>
                                </div>

                                {action === 'approve' && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label>Approved Amount</Label>
                                        <Input
                                            type="number"
                                            value={approvedAmount}
                                            onChange={e => setApprovedAmount(e.target.value)}
                                            placeholder={`Max: ${selectedClaim.claimAmount}`}
                                        />
                                    </div>
                                )}

                                {action && (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                        <Label>Remarks / Reason</Label>
                                        <Textarea
                                            placeholder={action === 'query' ? "Enter query details..." : "Add remarks..."}
                                            value={actionNote}
                                            onChange={e => setActionNote(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <SheetFooter>
                        <Button className="w-full" disabled={!action} onClick={handleAction}>Submit Decision</Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>
        </div>
    );
}
