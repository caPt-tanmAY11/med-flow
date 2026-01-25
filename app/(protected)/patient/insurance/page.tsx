
"use client";

import { useEffect, useState } from 'react';
import {
    Shield,
    Plus,
    FileText,
    AlertCircle,
    CheckCircle,
    Clock,
    Activity,
    Upload,
    X,
    MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Policy {
    id: string;
    insurerName: string;
    policyNumber: string;
    validTo: string;
    sumInsured: number;
    tpaName?: string;
}

interface Claim {
    id: string;
    status: string;
    claimAmount: number;
    approvedAmount?: number;
    submittedAt: string;
    policy: { insurerName: string };
    bill: { billNumber: string; totalAmount: number };
}

export default function PatientInsurancePage() {
    const { toast } = useToast();
    const [hasInsurance, setHasInsurance] = useState(false);
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddPolicy, setShowAddPolicy] = useState(false);

    // Form State
    const [newPolicy, setNewPolicy] = useState({
        insurerName: '',
        policyNumber: '',
        policyType: 'cashless',
        sumInsured: '',
        validFrom: '',
        validTo: '',
        tpaName: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [policiesRes, claimsRes] = await Promise.all([
                fetch('/api/insurance?type=policies'),
                fetch('/api/insurance?type=claims') // In real app, filter by patient context
            ]);
            const policiesData = await policiesRes.json();
            const claimsData = await claimsRes.json();

            if (policiesData.data) {
                setPolicies(policiesData.data);
                if (policiesData.data.length > 0) setHasInsurance(true);
            }
            if (claimsData.data) setClaims(claimsData.data);
        } catch (error) {
            console.error('Failed to fetch data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPolicy = async () => {
        try {
            // In a real app, you'd POST to create a policy
            toast({ title: "Policy Added", description: "Your policy details have been saved." });
            setShowAddPolicy(false);
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to add policy", variant: "destructive" });
        }
    };

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Insurance & Claims</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your health insurance policies and track claims.</p>
                </div>
                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-sm font-medium">I have Health Insurance</span>
                    <Switch checked={hasInsurance} onCheckedChange={setHasInsurance} />
                </div>
            </div>

            {!hasInsurance ? (
                <Card className="border-dashed border-2 bg-slate-50 dark:bg-slate-900/50">
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Shield className="w-16 h-16 text-slate-300 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Insurance Details Found</h3>
                        <p className="text-slate-500 max-w-md mb-6">Adding your insurance details helps in faster admission and cashless treatment processing.</p>
                        <Button onClick={() => { setHasInsurance(true); setShowAddPolicy(true); }}>
                            <Plus className="w-4 h-4 mr-2" /> Add Insurance Policy
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="policies" className="space-y-6">
                    <TabsList className="bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 rounded-xl">
                        <TabsTrigger value="policies" className="rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700">My Policies</TabsTrigger>
                        <TabsTrigger value="claims" className="rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">Claims Status</TabsTrigger>
                        <TabsTrigger value="grievances" className="rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700">Grievances</TabsTrigger>
                    </TabsList>

                    <TabsContent value="policies" className="space-y-4">
                        <div className="flex justify-end">
                            <Button onClick={() => setShowAddPolicy(true)}><Plus className="w-4 h-4 mr-2" />Add New Policy</Button>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {policies.map(policy => (
                                <Card key={policy.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 group">
                                    <div className="h-2 bg-gradient-to-r from-blue-500 to-teal-500" />
                                    <CardContent className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">{policy.insurerName}</h3>
                                                <p className="text-sm text-slate-500 font-mono">{policy.policyNumber}</p>
                                            </div>
                                            <Shield className="w-8 h-8 text-teal-500 opacity-20 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-500">Sum Insured</span>
                                                <span className="font-semibold">₹{policy.sumInsured.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                                                <span className="text-slate-500">Valid Till</span>
                                                <span>{new Date(policy.validTo).toLocaleDateString()}</span>
                                            </div>
                                            {policy.tpaName && (
                                                <div className="flex justify-between py-2">
                                                    <span className="text-slate-500">TPA</span>
                                                    <span className="text-blue-600">{policy.tpaName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="claims" className="space-y-4">
                        {claims.length === 0 ? (
                            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500">No active claims found</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {claims.map(claim => (
                                    <Card key={claim.id} className="group hover:border-blue-500 transition-colors">
                                        <CardContent className="p-6 flex flex-col md:flex-row gap-6 items-center">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                                                <Activity className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-lg">Claim for Bill #{claim.bill.billNumber}</h3>
                                                    <Badge className={
                                                        claim.status === 'approved' ? 'bg-green-100 text-green-700 hover:bg-green-100' :
                                                            claim.status === 'rejected' ? 'bg-red-100 text-red-700 hover:bg-red-100' :
                                                                'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                                                    }>
                                                        {claim.status.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-slate-500">{claim.policy.insurerName} • Submitted on {new Date(claim.submittedAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-slate-500">Claim Amount</p>
                                                <p className="text-xl font-bold">₹{claim.claimAmount.toLocaleString()}</p>
                                                {claim.approvedAmount && (
                                                    <p className="text-sm text-green-600 font-medium">Approved: ₹{claim.approvedAmount.toLocaleString()}</p>
                                                )}
                                            </div>
                                            <Button variant="outline" size="sm">
                                                <MessageSquare className="w-4 h-4 mr-2" /> Track & Grievance
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}

            <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add Insurance Policy</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Insurer Name</Label>
                            <Input placeholder="e.g. Star Health, HDFC ERGO" value={newPolicy.insurerName} onChange={e => setNewPolicy({ ...newPolicy, insurerName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Policy Number</Label>
                            <Input placeholder="Policy / Member ID" value={newPolicy.policyNumber} onChange={e => setNewPolicy({ ...newPolicy, policyNumber: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valid From</Label>
                                <Input type="date" value={newPolicy.validFrom} onChange={e => setNewPolicy({ ...newPolicy, validFrom: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Valid To</Label>
                                <Input type="date" value={newPolicy.validTo} onChange={e => setNewPolicy({ ...newPolicy, validTo: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Sum Insured</Label>
                            <Input type="number" placeholder="500000" value={newPolicy.sumInsured} onChange={e => setNewPolicy({ ...newPolicy, sumInsured: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>TPA (Third Party Administrator)</Label>
                            <Input placeholder="e.g. MediAssist (Optional)" value={newPolicy.tpaName} onChange={e => setNewPolicy({ ...newPolicy, tpaName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Upload Policy Document</Label>
                            <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 flex flex-col items-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">Click to upload PDF</span>
                            </div>
                        </div>
                    </div>
                    <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={handleAddPolicy}>Save Policy Details</Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
