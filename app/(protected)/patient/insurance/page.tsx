
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

    import { addInsurancePolicy, getPatientPolicies } from '@/app/actions/insurance';
    import { useTransition } from 'react';

    // ... imports

    export default function PatientInsurancePage() {
        const { toast } = useToast();
        const [isPending, startTransition] = useTransition();
        const [hasInsurance, setHasInsurance] = useState(false);
        
        const [policies, setPolicies] = useState<Policy[]>([]);
        const [claims, setClaims] = useState<Claim[]>([
             { 
                id: 'c1', status: 'processing', claimAmount: 12000, submittedAt: '2024-01-10', 
                policy: { insurerName: 'Star Health' }, 
                bill: { billNumber: 'BILL-001', totalAmount: 15000 } 
            }
        ]);
        
        const [showAddPolicy, setShowAddPolicy] = useState(false);
        const [showRaiseGrievance, setShowRaiseGrievance] = useState(false);
    
        // Form State
        const [newPolicy, setNewPolicy] = useState({
            insurerName: '',
            policyNumber: '',
            sumInsured: '',
            validFrom: '',
            validTo: '',
            tpaName: ''
        });
    
        useEffect(() => {
            const fetchPolicies = async () => {
                const data = await getPatientPolicies();
                // Map the DB data to match the UI State Policy interface if needed
                // Assuming DB returns compatible structure or we map it here
                if (data.length > 0) {
                    setPolicies(data as unknown as Policy[]); // Quick cast for now, ideally align interfaces
                    setHasInsurance(true);
                }
            };
            fetchPolicies();
        }, []);
    
        const handleAddPolicy = () => {
            if (!newPolicy.insurerName || !newPolicy.policyNumber) {
                toast({ title: "Validation Error", description: "Please fill in Insurer Name and Policy Number.", variant: "destructive" });
                return;
            }

            startTransition(async () => {
                const result = await addInsurancePolicy(newPolicy);
                
                if (result.error) {
                    toast({ title: "Error", description: result.error, variant: "destructive" });
                } else {
                    toast({ title: "Policy Added Successfully", description: `${newPolicy.insurerName} policy has been linked to your account.` });
                    setShowAddPolicy(false);
                    setNewPolicy({ insurerName: '', policyNumber: '', sumInsured: '', validFrom: '', validTo: '', tpaName: '' });
                    
                    // Refresh local list
                    const updatedPolicies = await getPatientPolicies();
                    setPolicies(updatedPolicies as unknown as Policy[]);
                    setHasInsurance(true);
                }
            });
        };
    
        const handleRaiseGrievance = () => {
            toast({ title: "Grievance Submitted", description: "Ticket #GRV-2024-998 has been created. We will contact you shortly." });
            setShowRaiseGrievance(false);
        }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 leading-tight">Insurance & Claims</h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage your health coverage, track claims, and resolve issues.</p>
                </div>
                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm self-start">
                    <div className={hasInsurance ? "p-2 bg-teal-100 text-teal-700 rounded-lg" : "p-2 bg-slate-100 text-slate-500 rounded-lg"}>
                        <Shield className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-slate-900">Coverage Status</p>
                        <p className="text-xs text-slate-500">{hasInsurance ? 'Active Policy Linked' : 'No Insurance Linked'}</p>
                    </div>
                    <Switch checked={hasInsurance} onCheckedChange={setHasInsurance} className="ml-2 data-[state=checked]:bg-teal-600" />
                </div>
            </div>

            {!hasInsurance ? (
                <Card className="border-dashed border-2 bg-white/50 border-slate-300 shadow-none py-12">
                    <CardContent className="flex flex-col items-center justify-center text-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                            <Shield className="w-10 h-10 text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Insurance Details Found</h3>
                        <p className="text-slate-500 max-w-md mb-8 leading-relaxed">Adding your insurance details helps in faster hospital admission and seamless cashless treatment processing.</p>
                        <Button 
                            onClick={() => { setShowAddPolicy(true); }} 
                            className="h-12 px-8 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20 transition-all hover:scale-105"
                        >
                            <Plus className="w-5 h-5 mr-2" /> Link Insurance Policy
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="policies" className="space-y-8">
                    <TabsList className="bg-white p-1.5 border border-slate-200 rounded-xl shadow-sm inline-flex h-auto gap-2">
                        <TabsTrigger value="policies" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-teal-50 data-[state=active]:text-teal-700 data-[state=active]:shadow-none font-medium transition-all">My Policies</TabsTrigger>
                        <TabsTrigger value="claims" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow-none font-medium transition-all">Claims Status</TabsTrigger>
                        <TabsTrigger value="grievances" className="px-6 py-2.5 rounded-lg data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-none font-medium transition-all">Grievances</TabsTrigger>
                    </TabsList>

                    <TabsContent value="policies" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex justify-end">
                            <Button onClick={() => setShowAddPolicy(true)} className="bg-slate-900 text-white hover:bg-slate-800 rounded-xl"><Plus className="w-4 h-4 mr-2" />Add New Policy</Button>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {policies.map(policy => (
                                <Card key={policy.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-slate-200 bg-white">
                                    <div className="h-1.5 bg-gradient-to-r from-teal-500 to-blue-500" />
                                    <CardContent className="p-6 relative">
                                        <div className="absolute top-4 right-4 text-slate-100 group-hover:text-teal-50 transition-colors pointer-events-none">
                                            <Shield className="w-24 h-24 rotate-12" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="mb-6">
                                                <h3 className="font-bold text-xl text-slate-900">{policy.insurerName}</h3>
                                                <p className="text-sm font-mono text-slate-500 mt-1 bg-slate-100 inline-block px-2 py-0.5 rounded border border-slate-200">{policy.policyNumber}</p>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                                    <span className="text-sm text-slate-500 font-medium">Sum Insured</span>
                                                    <span className="font-bold text-slate-900 text-lg">₹{policy.sumInsured.toLocaleString()}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-slate-400 text-xs uppercase font-semibold">Valid Till</span>
                                                        <p className="font-medium text-slate-700 mt-0.5">{new Date(policy.validTo).toLocaleDateString()}</p>
                                                    </div>
                                                    {policy.tpaName && (
                                                        <div className="text-right">
                                                            <span className="text-slate-400 text-xs uppercase font-semibold">TPA Provider</span>
                                                            <p className="font-medium text-blue-600 mt-0.5">{policy.tpaName}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <div className="bg-slate-50 p-3 border-t border-slate-100 flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-teal-600 h-8">View Details</Button>
                                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 h-8">Download Card</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="claims" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {claims.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-slate-900">No Active Claims</h3>
                                <p className="text-slate-500">You haven't submitted any insurance claims yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {claims.map(claim => (
                                    <div key={claim.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-6 items-center group">
                                        <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Activity className="w-7 h-7" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="font-bold text-lg text-slate-900">Claim for Bill #{claim.bill.billNumber}</h3>
                                                <Badge className={
                                                    claim.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                                        claim.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                                            'bg-amber-100 text-amber-700 border-amber-200'
                                                }>
                                                    {claim.status.replace('_', ' ').toUpperCase()}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-slate-500">{claim.policy.insurerName} • Submitted on {new Date(claim.submittedAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right min-w-[140px]">
                                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Claim Amount</p>
                                            <p className="text-2xl font-bold text-slate-900">₹{claim.claimAmount.toLocaleString()}</p>
                                            {claim.approvedAmount && (
                                                <p className="text-sm text-green-600 font-medium flex items-center justify-end gap-1 mt-1">
                                                    <CheckCircle className="w-3 h-3" /> Approved: ₹{claim.approvedAmount.toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                        <Button variant="outline" className="border-slate-200 hover:bg-slate-50 hover:text-blue-600 rounded-xl">
                                            Track Status
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                    
                    <TabsContent value="grievances" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Grievance Redressal</h3>
                                <p className="text-slate-500">Track and manage your insurance related complaints</p>
                            </div>
                            <Button onClick={() => setShowRaiseGrievance(true)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
                                <MessageSquare className="w-4 h-4 mr-2" /> Raise Grievance
                            </Button>
                        </div>
                        
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                             <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4 text-orange-500">
                                    <Clock className="w-8 h-8" />
                                </div>
                                <h3 className="text-lg font-semibold text-slate-900">No Open Grievances</h3>
                                <p className="text-slate-500 max-w-sm mx-auto mt-2">You don't have any active grievances. If you face any issues with claims or policies, you can raise a ticket here.</p>
                             </div>
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* Add Policy Dialog */}
            <Dialog open={showAddPolicy} onOpenChange={setShowAddPolicy}>
                <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden gap-0 rounded-2xl border-0 shadow-2xl" overlayClassName="bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-teal-600 p-6 text-white relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                            <Shield className="w-32 h-32 rotate-12" />
                        </div>
                        <DialogHeader className="relative z-10 text-left">
                            <DialogTitle className="text-2xl font-bold">Add Insurance Policy</DialogTitle>
                            <div className="text-teal-100 mt-1">Link your health policy for seamless claims</div>
                        </DialogHeader>
                    </div>
                    
                    <div className="p-8 space-y-5 bg-white">
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2 col-span-2">
                                <Label className="text-slate-700 font-medium">Insurer Name</Label>
                                <Input placeholder="e.g. Star Health, HDFC ERGO" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" value={newPolicy.insurerName} onChange={e => setNewPolicy({ ...newPolicy, insurerName: e.target.value })} />
                            </div>
                            <div className="space-y-2 col-span-2">
                                <Label className="text-slate-700 font-medium">Policy Number</Label>
                                <Input placeholder="Policy / Member ID" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg font-mono" value={newPolicy.policyNumber} onChange={e => setNewPolicy({ ...newPolicy, policyNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Valid From</Label>
                                <Input type="date" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" value={newPolicy.validFrom} onChange={e => setNewPolicy({ ...newPolicy, validFrom: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Valid To</Label>
                                <Input type="date" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" value={newPolicy.validTo} onChange={e => setNewPolicy({ ...newPolicy, validTo: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">Sum Insured (₹)</Label>
                                <Input type="number" placeholder="500000" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" value={newPolicy.sumInsured} onChange={e => setNewPolicy({ ...newPolicy, sumInsured: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-slate-700 font-medium">TPA (Optional)</Label>
                                <Input placeholder="e.g. MediAssist" className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg" value={newPolicy.tpaName} onChange={e => setNewPolicy({ ...newPolicy, tpaName: e.target.value })} />
                            </div>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                            <Button variant="outline" onClick={() => setShowAddPolicy(false)} className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900">Cancel</Button>
                            <Button className="flex-1 h-12 bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-lg shadow-teal-600/20" onClick={handleAddPolicy}>Save Policy</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

             {/* Raise Grievance Dialog */}
             <Dialog open={showRaiseGrievance} onOpenChange={setShowRaiseGrievance}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden gap-0 rounded-2xl border-0 shadow-2xl" overlayClassName="bg-black/20 backdrop-blur-[2px]">
                    <div className="bg-orange-600 p-6 text-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold">Raise Grievance</DialogTitle>
                            <div className="text-orange-100 mt-1">We are here to help you resolve your issues</div>
                        </DialogHeader>
                    </div>
                    <div className="p-8 space-y-5 bg-white">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <select className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500">
                                <option>Claim Rejection</option>
                                <option>Delayed Processing</option>
                                <option>Incorrect Amount</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                             <Label>Description</Label>
                             <textarea className="w-full h-32 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none" placeholder="Describe your issue in detail..." />
                        </div>
                         <Button className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl" onClick={handleRaiseGrievance}>Submit Ticket</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
