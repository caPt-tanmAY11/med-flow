"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Receipt, RefreshCw, Loader2, CreditCard, IndianRupee, X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Bill {
    id: string;
    billNumber: string;
    status: string;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    createdAt: string;
    patient: { uhid: string; name: string };
    items: { category: string; description: string; totalPrice: number }[];
    payments: { amount: number; paymentMode: string; receivedAt: string }[];
}

export default function BillingPage() {
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const patientIdFromUrl = searchParams.get('patientId');
    const [loading, setLoading] = useState(true);
    const [bills, setBills] = useState<Bill[]>([]);
    const [stats, setStats] = useState({ todayRevenue: 0, pendingAmount: 0 });
    const [filter, setFilter] = useState('');
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('cash');
    const [saving, setSaving] = useState(false);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter) params.append('status', filter);
            if (patientIdFromUrl) params.append('patientId', patientIdFromUrl);
            const response = await fetch(`/api/billing?${params}`);
            const result = await response.json();
            setBills(result.data || []);
            setStats(result.stats || { todayRevenue: 0, pendingAmount: 0 });
        } catch (error) {
            console.error('Failed to fetch bills:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBills(); }, [filter, patientIdFromUrl]);

    const handlePayment = async () => {
        if (!selectedBill || !paymentAmount) return;
        const amount = parseFloat(paymentAmount);
        if (amount <= 0 || amount > selectedBill.balanceDue) {
            toast({ title: 'Error', description: 'Invalid amount', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`/api/billing/${selectedBill.id}?action=payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, paymentMode, receivedBy: 'Cashier' }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: `Payment of ₹${amount} received` });
                setShowPaymentModal(false);
                setSelectedBill(null);
                setPaymentAmount('');
                fetchBills();
            } else {
                const err = await response.json();
                toast({ title: 'Error', description: err.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to process payment', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const openPayment = (bill: Bill) => { setSelectedBill(bill); setPaymentAmount(bill.balanceDue.toString()); setShowPaymentModal(true); };
    const openDetails = (bill: Bill) => { setSelectedBill(bill); setShowDetailsModal(true); };

    const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { draft: 'bg-gray-100 text-gray-600', pending: 'bg-status-warning/10 text-status-warning', partial: 'bg-blue-100 text-blue-700', paid: 'bg-status-success/10 text-status-success', cancelled: 'bg-gray-100 text-gray-500' };
        return styles[status] || 'bg-gray-100 text-gray-500';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div><h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" />Billing</h1><p className="text-sm text-muted-foreground mt-1">Manage patient bills and payments</p></div>
                <Button variant="outline" size="sm" onClick={fetchBills}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="kpi-card border-l-4 border-l-status-success"><p className="text-xs text-muted-foreground">Today&apos;s Revenue</p><p className="text-2xl font-bold text-status-success">{formatCurrency(stats.todayRevenue)}</p></div>
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">Pending Amount</p><p className="text-2xl font-bold text-status-warning">{formatCurrency(stats.pendingAmount)}</p></div>
            </div>

            <div className="flex gap-2">
                {['', 'pending', 'partial', 'paid'].map((s) => (<Button key={s} variant={filter === s ? 'default' : 'outline'} size="sm" onClick={() => setFilter(s)}>{s || 'All'}</Button>))}
            </div>

            <div className="floating-card overflow-hidden">
                {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : bills.length === 0 ? <p className="text-center text-muted-foreground py-8">No bills found</p> : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr><th className="text-left p-3 text-xs font-medium text-muted-foreground">Bill #</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Patient</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Total</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Paid</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Balance</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th></tr>
                        </thead>
                        <tbody className="divide-y">
                            {bills.map((bill) => (
                                <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-3 font-mono text-sm cursor-pointer hover:text-primary" onClick={() => openDetails(bill)}>{bill.billNumber}</td>
                                    <td className="p-3"><p className="text-sm">{bill.patient.name}</p><p className="text-xs text-muted-foreground">{bill.patient.uhid}</p></td>
                                    <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(bill.status))}>{bill.status}</span></td>
                                    <td className="p-3 text-right font-medium">{formatCurrency(bill.totalAmount)}</td>
                                    <td className="p-3 text-right text-status-success">{formatCurrency(bill.paidAmount)}</td>
                                    <td className="p-3 text-right text-status-warning font-medium">{formatCurrency(bill.balanceDue)}</td>
                                    <td className="p-3 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => openDetails(bill)}>View</Button>
                                            {bill.balanceDue > 0 && <Button size="sm" onClick={() => openPayment(bill)}><CreditCard className="w-4 h-4 mr-1" />Pay</Button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedBill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background p-6 rounded-xl max-w-md w-full">
                        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Receive Payment</h3><Button variant="ghost" size="sm" onClick={() => { setShowPaymentModal(false); setSelectedBill(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4"><div className="flex justify-between"><span className="text-muted-foreground">Bill</span><span>{selectedBill.billNumber}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{selectedBill.patient.name}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Balance Due</span><span className="font-bold">{formatCurrency(selectedBill.balanceDue)}</span></div></div>
                        <div className="space-y-4">
                            <div><Label>Amount</Label><div className="relative mt-1"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="pl-9" placeholder="Enter amount" max={selectedBill.balanceDue} /></div></div>
                            <div><Label>Payment Mode</Label><select className="elegant-select" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}><option value="cash">Cash</option><option value="card">Card</option><option value="upi">UPI</option><option value="neft">NEFT</option></select></div>
                        </div>
                        <div className="flex gap-2 justify-end mt-6"><Button variant="outline" onClick={() => { setShowPaymentModal(false); setSelectedBill(null); }}>Cancel</Button><Button onClick={handlePayment} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Confirm Payment</Button></div>
                    </div>
                </div>
            )}

            {/* Bill Details Modal */}
            {showDetailsModal && selectedBill && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background p-6 rounded-xl max-w-lg w-full max-h-[80vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-lg">Bill Details - {selectedBill.billNumber}</h3><Button variant="ghost" size="sm" onClick={() => { setShowDetailsModal(false); setSelectedBill(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className="space-y-3 mb-4"><div className="flex justify-between"><span className="text-muted-foreground">Patient</span><span>{selectedBill.patient.name} ({selectedBill.patient.uhid})</span></div><div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(selectedBill.createdAt).toLocaleDateString()}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(selectedBill.status))}>{selectedBill.status}</span></div></div>
                        <div className="mb-4"><h4 className="font-medium mb-2">Items</h4><div className="space-y-2">{selectedBill.items.map((item, i) => (<div key={i} className="flex justify-between text-sm p-2 bg-muted/30 rounded"><span>{item.description}</span><span className="font-medium">{formatCurrency(item.totalPrice)}</span></div>))}</div></div>
                        <div className="border-t pt-4 space-y-2"><div className="flex justify-between font-medium"><span>Total</span><span>{formatCurrency(selectedBill.totalAmount)}</span></div><div className="flex justify-between text-status-success"><span>Paid</span><span>{formatCurrency(selectedBill.paidAmount)}</span></div><div className="flex justify-between text-status-warning font-bold"><span>Balance</span><span>{formatCurrency(selectedBill.balanceDue)}</span></div></div>
                        {selectedBill.payments.length > 0 && (<div className="mt-4"><h4 className="font-medium mb-2">Payments</h4><div className="space-y-2">{selectedBill.payments.map((p, i) => (<div key={i} className="flex justify-between text-sm p-2 bg-status-success/5 rounded"><span className="capitalize">{p.paymentMode} - {new Date(p.receivedAt).toLocaleDateString()}</span><span className="text-status-success font-medium">{formatCurrency(p.amount)}</span></div>))}</div></div>)}
                        <div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => { setShowDetailsModal(false); setSelectedBill(null); }}>Close</Button>{selectedBill.balanceDue > 0 && <Button onClick={() => { setShowDetailsModal(false); openPayment(selectedBill); }}>Record Payment</Button>}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
