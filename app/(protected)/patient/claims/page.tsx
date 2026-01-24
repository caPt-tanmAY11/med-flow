'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Shield,
    FileText,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Plus,
    Upload,
    Building2,
    IndianRupee,
    Send,
    MessageSquare,
    ChevronRight,
    Calendar,
    User,
} from 'lucide-react';

interface Policy {
    id: string;
    insurerName: string;
    policyNumber: string;
    policyType: string;
    sumInsured: number;
    validFrom: string;
    validTo: string;
    tpaName?: string;
    isActive: boolean;
    claims: Array<{ id: string; status: string; claimAmount: number; approvedAmount?: number }>;
}

interface Claim {
    id: string;
    claimAmount: number;
    approvedAmount?: number;
    status: string;
    submittedAt: string;
    settledAt?: string;
    rejectionReason?: string;
    bill: {
        id: string;
        billNumber: string;
        totalAmount: number;
        patient: { name: string; uhid: string };
    };
    policy: {
        insurerName: string;
        policyNumber: string;
        tpaName?: string;
    };
}

interface Bill {
    id: string;
    billNumber: string;
    totalAmount: number;
    status: string;
}

const claimStatusColors: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    query_raised: 'bg-orange-100 text-orange-800',
    approved: 'bg-green-100 text-green-800',
    partially_approved: 'bg-teal-100 text-teal-800',
    rejected: 'bg-red-100 text-red-800',
    settled: 'bg-emerald-100 text-emerald-800',
};

const claimStatusIcons: Record<string, React.ReactNode> = {
    submitted: <Send className="h-4 w-4" />,
    under_review: <Clock className="h-4 w-4" />,
    query_raised: <AlertCircle className="h-4 w-4" />,
    approved: <CheckCircle2 className="h-4 w-4" />,
    partially_approved: <CheckCircle2 className="h-4 w-4" />,
    rejected: <XCircle className="h-4 w-4" />,
    settled: <CheckCircle2 className="h-4 w-4" />,
};

export default function PatientClaimsPage() {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [bills, setBills] = useState<Bill[]>([]);
    const [insurerList, setInsurerList] = useState<Array<{ code: string; name: string }>>([]);
    const [tpaList, setTpaList] = useState<Array<{ code: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [addPolicyModal, setAddPolicyModal] = useState(false);
    const [submitClaimModal, setSubmitClaimModal] = useState(false);
    const [grievanceModal, setGrievanceModal] = useState(false);
    const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

    // Form states
    const [policyForm, setPolicyForm] = useState({
        insurerName: '',
        policyNumber: '',
        policyType: 'Individual',
        sumInsured: '',
        validFrom: '',
        validTo: '',
        tpaCode: '',
    });
    const [claimForm, setClaimForm] = useState({
        billId: '',
        policyId: '',
    });
    const [grievanceForm, setGrievanceForm] = useState({
        subject: '',
        description: '',
    });

    // Demo patient ID
    const patientId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('patientId') || 'demo'
        : 'demo';

    useEffect(() => {
        fetchData();
        fetchOptions();
    }, [patientId]);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch policies
            const policyRes = await fetch(`/api/insurance/policy?patientId=${patientId}`);
            const policyData = await policyRes.json();
            setPolicies(policyData.policies || []);

            // Fetch claims
            const claimsRes = await fetch(`/api/insurance/claim?patientId=${patientId}`);
            const claimsData = await claimsRes.json();
            setClaims(claimsData.claims || []);

            // Fetch bills for claim submission
            const billsRes = await fetch(`/api/billing/aggregate?patientId=${patientId}`);
            const billsData = await billsRes.json();
            setBills(billsData.bills?.filter((b: Bill) => b.status === 'finalized') || []);

        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            const res = await fetch('/api/insurance/policy?options=true');
            const data = await res.json();
            setInsurerList(data.insurerList || []);
            setTpaList(data.tpaList || []);
        } catch (error) {
            console.error('Failed to fetch options:', error);
        }
    };

    const handleAddPolicy = async () => {
        try {
            const res = await fetch('/api/insurance/policy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId,
                    ...policyForm,
                    tpaName: tpaList.find(t => t.code === policyForm.tpaCode)?.name,
                })
            });

            if (res.ok) {
                setAddPolicyModal(false);
                setPolicyForm({
                    insurerName: '',
                    policyNumber: '',
                    policyType: 'Individual',
                    sumInsured: '',
                    validFrom: '',
                    validTo: '',
                    tpaCode: '',
                });
                fetchData();
            }
        } catch (error) {
            console.error('Failed to add policy:', error);
        }
    };

    const handleSubmitClaim = async () => {
        try {
            const res = await fetch('/api/insurance/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'submit',
                    ...claimForm,
                })
            });

            if (res.ok) {
                setSubmitClaimModal(false);
                setClaimForm({ billId: '', policyId: '' });
                fetchData();
            }
        } catch (error) {
            console.error('Failed to submit claim:', error);
        }
    };

    const handleFileGrievance = async () => {
        // In real implementation, this would call a grievance API
        console.log('Filing grievance:', grievanceForm, 'for claim:', selectedClaim?.id);
        setGrievanceModal(false);
        setGrievanceForm({ subject: '', description: '' });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    const activePolicies = policies.filter(p => p.isActive && new Date(p.validTo) >= new Date());

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Shield className="h-8 w-8 text-primary" />
                        Insurance Claims
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage your insurance policies and claims</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setAddPolicyModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Policy
                    </Button>
                    {activePolicies.length > 0 && bills.length > 0 && (
                        <Button onClick={() => setSubmitClaimModal(true)}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Claim
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Active Policies</p>
                                <p className="text-2xl font-bold">{activePolicies.length}</p>
                            </div>
                            <Shield className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Claims</p>
                                <p className="text-2xl font-bold">{claims.length}</p>
                            </div>
                            <FileText className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {claims.filter(c => ['submitted', 'under_review'].includes(c.status)).length}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Approved Amount</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {formatCurrency(claims.reduce((sum, c) => sum + (c.approvedAmount || 0), 0))}
                                </p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="policies" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="policies">My Policies</TabsTrigger>
                    <TabsTrigger value="claims">Claim Tracker</TabsTrigger>
                </TabsList>

                {/* Policies Tab */}
                <TabsContent value="policies">
                    <div className="grid gap-4">
                        {policies.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">No insurance policies added yet</p>
                                    <Button className="mt-4" onClick={() => setAddPolicyModal(true)}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Add Your First Policy
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            policies.map((policy) => (
                                <Card key={policy.id} className={!policy.isActive ? 'opacity-60' : ''}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-start gap-4">
                                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                    <Building2 className="h-6 w-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-lg">{policy.insurerName}</h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        Policy: {policy.policyNumber} • {policy.policyType}
                                                    </p>
                                                    {policy.tpaName && (
                                                        <p className="text-sm text-muted-foreground">
                                                            TPA: {policy.tpaName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={policy.isActive && new Date(policy.validTo) >= new Date() ? 'default' : 'secondary'}>
                                                    {policy.isActive && new Date(policy.validTo) >= new Date() ? 'Active' : 'Expired'}
                                                </Badge>
                                                <p className="text-2xl font-bold mt-2">{formatCurrency(policy.sumInsured)}</p>
                                                <p className="text-xs text-muted-foreground">Sum Insured</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                Valid: {formatDate(policy.validFrom)} - {formatDate(policy.validTo)}
                                            </div>
                                            {policy.claims.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    {policy.claims.length} claim(s)
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* Claims Tab */}
                <TabsContent value="claims">
                    <div className="grid gap-4">
                        {claims.length === 0 ? (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                    <p className="text-muted-foreground">No claims submitted yet</p>
                                </CardContent>
                            </Card>
                        ) : (
                            claims.map((claim) => (
                                <Card key={claim.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={claimStatusColors[claim.status]}>
                                                        {claimStatusIcons[claim.status]}
                                                        <span className="ml-1 capitalize">{claim.status.replace('_', ' ')}</span>
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        Submitted {formatDate(claim.submittedAt)}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold">Bill: {claim.bill.billNumber}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {claim.policy.insurerName} • {claim.policy.policyNumber}
                                                </p>
                                                {claim.policy.tpaName && (
                                                    <p className="text-xs text-muted-foreground">
                                                        TPA: {claim.policy.tpaName}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Claim Amount</p>
                                                <p className="text-xl font-bold">{formatCurrency(claim.claimAmount)}</p>
                                                {claim.approvedAmount !== undefined && claim.approvedAmount > 0 && (
                                                    <p className="text-sm text-green-600">
                                                        Approved: {formatCurrency(claim.approvedAmount)}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Status Timeline */}
                                        <div className="mt-4 pt-4 border-t">
                                            <div className="flex items-center justify-between text-xs">
                                                <div className="flex items-center gap-1">
                                                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                                                    <span>Submitted</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex items-center gap-1">
                                                    <div className={`h-3 w-3 rounded-full ${['under_review', 'query_raised', 'approved', 'partially_approved', 'settled'].includes(claim.status) ? 'bg-yellow-500' : 'bg-gray-300'}`}></div>
                                                    <span>Processing</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex items-center gap-1">
                                                    <div className={`h-3 w-3 rounded-full ${['approved', 'partially_approved', 'settled'].includes(claim.status) ? 'bg-green-500' : claim.status === 'rejected' ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                                    <span>{claim.status === 'rejected' ? 'Rejected' : 'Approved'}</span>
                                                </div>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex items-center gap-1">
                                                    <div className={`h-3 w-3 rounded-full ${claim.status === 'settled' ? 'bg-emerald-500' : 'bg-gray-300'}`}></div>
                                                    <span>Settled</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Rejection reason or action buttons */}
                                        {claim.rejectionReason && (
                                            <div className="mt-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                                <strong>Rejection Reason:</strong> {claim.rejectionReason}
                                            </div>
                                        )}

                                        {(claim.status === 'rejected' || claim.status === 'query_raised') && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => { setSelectedClaim(claim); setGrievanceModal(true); }}
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-2" />
                                                    Raise Grievance
                                                </Button>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Add Policy Modal */}
            <Dialog open={addPolicyModal} onOpenChange={setAddPolicyModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add Insurance Policy</DialogTitle>
                        <DialogDescription>Enter your insurance policy details</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Insurance Company</Label>
                            <Select
                                value={policyForm.insurerName}
                                onValueChange={(v) => setPolicyForm(prev => ({ ...prev, insurerName: v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Select insurer" /></SelectTrigger>
                                <SelectContent>
                                    {insurerList.map((i) => (
                                        <SelectItem key={i.code} value={i.name}>{i.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Policy Number</Label>
                            <Input
                                value={policyForm.policyNumber}
                                onChange={(e) => setPolicyForm(prev => ({ ...prev, policyNumber: e.target.value }))}
                                placeholder="e.g., STAR123456789"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Policy Type</Label>
                                <Select
                                    value={policyForm.policyType}
                                    onValueChange={(v) => setPolicyForm(prev => ({ ...prev, policyType: v }))}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Individual">Individual</SelectItem>
                                        <SelectItem value="Family">Family Floater</SelectItem>
                                        <SelectItem value="Corporate">Corporate</SelectItem>
                                        <SelectItem value="Government">Government (PMJAY/CGHS)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Sum Insured (₹)</Label>
                                <Input
                                    type="number"
                                    value={policyForm.sumInsured}
                                    onChange={(e) => setPolicyForm(prev => ({ ...prev, sumInsured: e.target.value }))}
                                    placeholder="500000"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Valid From</Label>
                                <Input
                                    type="date"
                                    value={policyForm.validFrom}
                                    onChange={(e) => setPolicyForm(prev => ({ ...prev, validFrom: e.target.value }))}
                                />
                            </div>
                            <div>
                                <Label>Valid To</Label>
                                <Input
                                    type="date"
                                    value={policyForm.validTo}
                                    onChange={(e) => setPolicyForm(prev => ({ ...prev, validTo: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>TPA (Third Party Administrator)</Label>
                            <Select
                                value={policyForm.tpaCode}
                                onValueChange={(v) => setPolicyForm(prev => ({ ...prev, tpaCode: v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Select TPA (if applicable)" /></SelectTrigger>
                                <SelectContent>
                                    {tpaList.map((t) => (
                                        <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddPolicyModal(false)}>Cancel</Button>
                        <Button onClick={handleAddPolicy}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Policy
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Submit Claim Modal */}
            <Dialog open={submitClaimModal} onOpenChange={setSubmitClaimModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Submit Insurance Claim</DialogTitle>
                        <DialogDescription>Select a bill and policy to submit your claim</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Select Bill</Label>
                            <Select
                                value={claimForm.billId}
                                onValueChange={(v) => setClaimForm(prev => ({ ...prev, billId: v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Choose a bill" /></SelectTrigger>
                                <SelectContent>
                                    {bills.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.billNumber} - {formatCurrency(b.totalAmount)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Select Policy</Label>
                            <Select
                                value={claimForm.policyId}
                                onValueChange={(v) => setClaimForm(prev => ({ ...prev, policyId: v }))}
                            >
                                <SelectTrigger><SelectValue placeholder="Choose a policy" /></SelectTrigger>
                                <SelectContent>
                                    {activePolicies.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.insurerName} - {p.policyNumber}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubmitClaimModal(false)}>Cancel</Button>
                        <Button onClick={handleSubmitClaim} disabled={!claimForm.billId || !claimForm.policyId}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Claim
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Grievance Modal */}
            <Dialog open={grievanceModal} onOpenChange={setGrievanceModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Raise Grievance</DialogTitle>
                        <DialogDescription>
                            File a complaint regarding your claim
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="p-3 bg-muted rounded-lg text-sm">
                            <p><strong>Claim:</strong> {selectedClaim?.bill.billNumber}</p>
                            <p><strong>Amount:</strong> {formatCurrency(selectedClaim?.claimAmount || 0)}</p>
                            <p><strong>Status:</strong> {selectedClaim?.status}</p>
                        </div>
                        <div>
                            <Label>Subject</Label>
                            <Input
                                value={grievanceForm.subject}
                                onChange={(e) => setGrievanceForm(prev => ({ ...prev, subject: e.target.value }))}
                                placeholder="e.g., Claim rejection without valid reason"
                            />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea
                                value={grievanceForm.description}
                                onChange={(e) => setGrievanceForm(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Describe your grievance in detail..."
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setGrievanceModal(false)}>Cancel</Button>
                        <Button onClick={handleFileGrievance}>
                            <Send className="h-4 w-4 mr-2" />
                            Submit Grievance
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
