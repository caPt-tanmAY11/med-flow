"use client";

import { useEffect, useState } from 'react';
import { Shield as InsuranceIcon, FileCheck, Clock, AlertCircle, RefreshCw, Loader2, Plus, X, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface InsurancePolicy {
    id: string;
    insurerName: string;
    policyNumber: string;
    policyType: string;
    sumInsured: number;
    validFrom: string;
    validTo: string;
    tpaName: string | null;
    patient: { uhid: string; name: string };
}

interface PreAuth {
    id: string;
    requestedAmount: number;
    approvedAmount: number | null;
    status: string;
    requestedAt: string;
    remarks: string | null;
    policy: { insurerName: string; policyNumber: string };
    encounterId: string;
}

interface Claim {
    id: string;
    claimAmount: number;
    approvedAmount: number | null;
    status: string;
    submittedAt: string;
    settledAt: string | null;
    rejectionReason: string | null;
    bill: { billNumber: string; totalAmount: number };
    policy: { insurerName: string; policyNumber: string };
}

export default function InsurancePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'preauth' | 'claims' | 'policies'>('preauth');
    const [preAuths, setPreAuths] = useState<PreAuth[]>([]);
    const [claims, setClaims] = useState<Claim[]>([]);
    const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
    const [showPreAuthModal, setShowPreAuthModal] = useState(false);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<PreAuth | Claim | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [preAuthRes, claimsRes, policiesRes] = await Promise.all([
                fetch('/api/insurance?type=preauth'),
                fetch('/api/insurance?type=claims'),
                fetch('/api/insurance?type=policies'),
            ]);
            const [preAuthData, claimsData, policiesData] = await Promise.all([
                preAuthRes.json(),
                claimsRes.json(),
                policiesRes.json(),
            ]);
            setPreAuths(preAuthData.data || []);
            setClaims(claimsData.data || []);
            setPolicies(policiesData.data || []);
        } catch (error) {
            console.error('Failed to fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleUpdatePreAuth = async (id: string, status: string, approvedAmount?: number) => {
        setSaving(true);
        try {
            const response = await fetch(`/api/insurance/${id}?type=preauth`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, approvedAmount }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Pre-auth ${status}` });
                fetchData();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateClaim = async (id: string, status: string, approvedAmount?: number, rejectionReason?: string) => {
        setSaving(true);
        try {
            const response = await fetch(`/api/insurance/${id}?type=claim`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, approvedAmount, rejectionReason }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Claim ${status}` });
                fetchData();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-status-warning/10 text-status-warning',
            approved: 'bg-status-success/10 text-status-success',
            'partially-approved': 'bg-blue-100 text-blue-700',
            rejected: 'bg-status-critical/10 text-status-critical',
            submitted: 'bg-blue-100 text-blue-700',
            query: 'bg-orange-100 text-orange-700',
            settled: 'bg-status-success/10 text-status-success',
        };
        return styles[status] || 'bg-gray-100 text-gray-600';
    };

    const stats = {
        pendingPreAuth: preAuths.filter(p => p.status === 'pending').length,
        approvedPreAuth: preAuths.filter(p => p.status === 'approved').length,
        pendingClaims: claims.filter(c => c.status !== 'settled' && c.status !== 'rejected').length,
        settledClaims: claims.filter(c => c.status === 'settled').length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><InsuranceIcon className="w-6 h-6 text-primary" />Insurance & Claims</h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage pre-authorizations and claims</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">Pending Pre-Auth</p><p className="text-2xl font-bold text-status-warning">{stats.pendingPreAuth}</p></div>
                <div className="kpi-card border-l-4 border-l-status-success"><p className="text-xs text-muted-foreground">Approved Pre-Auth</p><p className="text-2xl font-bold text-status-success">{stats.approvedPreAuth}</p></div>
                <div className="kpi-card border-l-4 border-l-blue-500"><p className="text-xs text-muted-foreground">Pending Claims</p><p className="text-2xl font-bold text-blue-500">{stats.pendingClaims}</p></div>
                <div className="kpi-card border-l-4 border-l-primary"><p className="text-xs text-muted-foreground">Settled Claims</p><p className="text-2xl font-bold text-primary">{stats.settledClaims}</p></div>
            </div>

            <div className="flex gap-2">
                <Button variant={activeTab === 'preauth' ? 'default' : 'outline'} onClick={() => setActiveTab('preauth')}>Pre-Authorizations ({preAuths.length})</Button>
                <Button variant={activeTab === 'claims' ? 'default' : 'outline'} onClick={() => setActiveTab('claims')}>Claims ({claims.length})</Button>
                <Button variant={activeTab === 'policies' ? 'default' : 'outline'} onClick={() => setActiveTab('policies')}>Policies ({policies.length})</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : activeTab === 'preauth' ? (
                <div className="floating-card overflow-hidden">
                    {preAuths.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No pre-authorizations</p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50"><tr><th className="text-left p-3 text-xs font-medium text-muted-foreground">Insurer</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Policy</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Requested</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Approved</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th></tr></thead>
                            <tbody className="divide-y">
                                {preAuths.map((pa) => (
                                    <tr key={pa.id} className="hover:bg-muted/30">
                                        <td className="p-3 font-medium">{pa.policy.insurerName}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{pa.policy.policyNumber}</td>
                                        <td className="p-3 text-right">{formatCurrency(pa.requestedAmount)}</td>
                                        <td className="p-3 text-right text-status-success">{pa.approvedAmount ? formatCurrency(pa.approvedAmount) : '-'}</td>
                                        <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(pa.status))}>{pa.status}</span></td>
                                        <td className="p-3 text-right">
                                            {pa.status === 'pending' && (
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" className="bg-status-success hover:bg-status-success/90" onClick={() => handleUpdatePreAuth(pa.id, 'approved', pa.requestedAmount)}>Approve</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleUpdatePreAuth(pa.id, 'rejected')}>Reject</Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : activeTab === 'claims' ? (
                <div className="floating-card overflow-hidden">
                    {claims.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No claims</p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50"><tr><th className="text-left p-3 text-xs font-medium text-muted-foreground">Bill #</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Insurer</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Claimed</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Approved</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th></tr></thead>
                            <tbody className="divide-y">
                                {claims.map((claim) => (
                                    <tr key={claim.id} className="hover:bg-muted/30">
                                        <td className="p-3 font-mono text-sm">{claim.bill.billNumber}</td>
                                        <td className="p-3">{claim.policy.insurerName}</td>
                                        <td className="p-3 text-right">{formatCurrency(claim.claimAmount)}</td>
                                        <td className="p-3 text-right text-status-success">{claim.approvedAmount ? formatCurrency(claim.approvedAmount) : '-'}</td>
                                        <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(claim.status))}>{claim.status}</span></td>
                                        <td className="p-3 text-right">
                                            {claim.status === 'submitted' && (
                                                <div className="flex justify-end gap-1">
                                                    <Button size="sm" className="bg-status-success hover:bg-status-success/90" onClick={() => handleUpdateClaim(claim.id, 'approved', claim.claimAmount)}>Approve</Button>
                                                    <Button size="sm" variant="outline" onClick={() => handleUpdateClaim(claim.id, 'settled', claim.claimAmount)}>Settle</Button>
                                                </div>
                                            )}
                                            {(claim.status === 'approved' || claim.status === 'partially-approved') && (
                                                <Button size="sm" onClick={() => handleUpdateClaim(claim.id, 'settled', claim.approvedAmount || claim.claimAmount)}>Mark Settled</Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {policies.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8 col-span-2">No policies</p>
                    ) : (
                        policies.map((policy) => (
                            <div key={policy.id} className="floating-card">
                                <div className="flex items-start justify-between mb-3">
                                    <div><p className="font-medium">{policy.insurerName}</p><p className="text-sm text-muted-foreground">{policy.policyNumber}</p></div>
                                    <span className={cn("px-2 py-1 text-xs rounded capitalize", policy.policyType === 'cashless' ? 'bg-status-success/10 text-status-success' : 'bg-blue-100 text-blue-700')}>{policy.policyType}</span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{policy.patient.name} ({policy.patient.uhid})</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Sum Insured</span><span className="font-medium">{formatCurrency(policy.sumInsured)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Valid</span><span>{new Date(policy.validFrom).toLocaleDateString()} - {new Date(policy.validTo).toLocaleDateString()}</span></div>
                                    {policy.tpaName && <div className="flex justify-between"><span className="text-muted-foreground">TPA</span><span>{policy.tpaName}</span></div>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
