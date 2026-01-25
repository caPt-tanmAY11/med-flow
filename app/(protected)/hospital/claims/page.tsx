
"use client";

import { useEffect, useState } from 'react';
import {
    FileText,
    Send,
    MoreVertical,
    Filter,
    PlusCircle,
    Building2,
    Calendar,
    Paperclip
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Claim {
    id: string;
    bill: { billNumber: string; totalAmount: number };
    patient: { name: string; uhid: string };
    policy: { insurerName: string; tpaName?: string };
    status: string;
    claimAmount: number;
    submittedAt: string;
}

export default function HospitalClaimsPage() {
    const { toast } = useToast();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [showNewProposal, setShowNewProposal] = useState(false);

    // Mock Data for "Bills Ready for Claim"
    const readyBills = [
        { id: 'b1', number: 'BILL-001', amount: 12500, patient: 'Rahul Kumar', insurer: 'Star Health' },
        { id: 'b2', number: 'BILL-002', amount: 45000, patient: 'Priya Singh', insurer: 'HDFC ERGO' }
    ];

    useEffect(() => {
        fetchClaims();
    }, []);

    const fetchClaims = async () => {
        try {
            const res = await fetch('/api/insurance?type=claims');
            const data = await res.json();
            if (data.data) setClaims(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProposal = async () => {
        toast({ title: "Proposal Sent", description: "Claim proposal sent to TPA/Insurer successfully." });
        setShowNewProposal(false);
        fetchClaims(); // Refresh
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Claims Management</h1>
                    <p className="text-muted-foreground">Manage insurance claims, proposals, and TPA communications.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" />Filter</Button>
                    <Button onClick={() => setShowNewProposal(true)} className="bg-blue-600 hover:bg-blue-700">
                        <PlusCircle className="w-4 h-4 mr-2" /> New Proposal
                    </Button>
                </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Total Claims</div>
                        <div className="text-2xl font-bold">{claims.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Pending Approval</div>
                        <div className="text-2xl font-bold text-orange-600">
                            {claims.filter(c => ['submitted', 'in_process'].includes(c.status)).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Approved Amount</div>
                        <div className="text-2xl font-bold text-green-600">₹45.2L</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-sm font-medium text-muted-foreground mb-1">Value Disputed</div>
                        <div className="text-2xl font-bold text-red-600">₹2.4L</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Claims</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Bill / Policy</th>
                                    <th className="px-4 py-3">TPA / Insurer</th>
                                    <th className="px-4 py-3 text-right">Claim Amount</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {claims.map((claim) => (
                                    <tr key={claim.id} className="bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            <div>{claim.patient?.name || 'Unknown'}</div>
                                            <div className="text-xs text-muted-foreground">{claim.patient?.uhid}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-mono">{claim.bill.billNumber}</div>
                                            <div className="text-xs text-muted-foreground">{claim.policy.insurerName}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {claim.policy.tpaName || 'Direct'}
                                            <div className="text-xs text-muted-foreground">{new Date(claim.submittedAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold">
                                            ₹{claim.claimAmount.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={claim.status === 'approved' ? 'default' : 'secondary'} className="capitalize">
                                                {claim.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={showNewProposal} onOpenChange={setShowNewProposal}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Create New Claim Proposal</DialogTitle>
                        <DialogDescription>Select a pending bill and attach necessary documents to initiate a claim.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="space-y-2">
                            <Label>Select Bill</Label>
                            <Select>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a bill..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {readyBills.map(bill => (
                                        <SelectItem key={bill.id} value={bill.id}>
                                            {bill.number} - {bill.patient} (₹{bill.amount})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Select TPA</Label>
                                <Select>
                                    <SelectTrigger><SelectValue placeholder="Select TPA" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="md">MediAssist</SelectItem>
                                        <SelectItem value="vh">Vidal Health</SelectItem>
                                        <SelectItem value="fh">Family Health Plan</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Claim Amount</Label>
                                <Input type="number" placeholder="Enter amount" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Attach Documents</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed">
                                    <FileText className="w-6 h-6 text-slate-400" />
                                    <span>Upload Bill PDF</span>
                                </Button>
                                <Button variant="outline" className="h-24 flex flex-col gap-2 border-dashed">
                                    <Paperclip className="w-6 h-6 text-slate-400" />
                                    <span>Clinical Notes & Reports</span>
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setShowNewProposal(false)}>Cancel</Button>
                        <Button onClick={handleCreateProposal} className="bg-teal-600 hover:bg-teal-700">Send Proposal</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
