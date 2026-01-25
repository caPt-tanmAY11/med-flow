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
    subtotal: number;
    taxAmount: number;
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

    const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');
    const [selectedPatientBills, setSelectedPatientBills] = useState<{ patient: { uhid: string; name: string }, bills: Bill[] } | null>(null);

    // Group bills by patient
    const patientSummary = bills.reduce((acc, bill) => {
        const key = bill.patient.uhid;
        if (!acc[key]) {
            acc[key] = {
                patient: bill.patient,
                totalPending: 0,
                totalPaid: 0,
                billCount: 0,
                bills: []
            };
        }
        acc[key].totalPending += bill.balanceDue;
        acc[key].totalPaid += bill.paidAmount;
        acc[key].billCount += 1;
        acc[key].bills.push(bill);
        return acc;
    }, {} as Record<string, { patient: { uhid: string; name: string }, totalPending: number, totalPaid: number, billCount: number, bills: Bill[] }>);

    const handlePatientClick = (uhid: string) => {
        const data = patientSummary[uhid];
        if (data) {
            setSelectedPatientBills({ patient: data.patient, bills: data.bills });
            setViewMode('details');
        }
    };

    const handlePrintInvoice = (bill: Bill) => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`
                <html>
                <head>
                    <title>Invoice - ${bill.billNumber}</title>
                    <style>
                        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
                        .header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
                        .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
                        .meta { text-align: right; font-size: 14px; color: #666; }
                        .bill-to { margin-bottom: 40px; }
                        .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                        .table th { text-align: left; padding: 12px; background: #f8fafc; font-size: 12px; text-transform: uppercase; color: #64748b; }
                        .table td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
                        .totals { width: 300px; margin-left: auto; }
                        .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
                        .totals-row.final { border-top: 2px solid #333; font-weight: bold; font-size: 16px; margin-top: 10px; padding-top: 10px; }
                        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 500; }
                        .paid { background: #dcfce7; color: #166534; }
                        .pending { background: #fefce8; color: #854d0e; }
                        .footer { margin-top: 60px; text-align: center; font-size: 12px; color: #94a3b8; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">MedFlow Hospital</div>
                        <div class="meta">
                            <p>Invoice #: ${bill.billNumber}</p>
                            <p>Date: ${new Date(bill.createdAt).toLocaleDateString()}</p>
                            <p>GSTIN: 27ABCDE1234F1Z5</p>
                        </div>
                    </div>

                    <div class="bill-to">
                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Bill To</p>
                        <h3 style="margin: 0;">${bill.patient.name}</h3>
                        <p style="margin: 5px 0 0;">UHID: ${bill.patient.uhid}</p>
                    </div>

                    <table class="table">
                        <thead>
                            <tr><th>Description</th><th style="text-align: right">Amount</th></tr>
                        </thead>
                        <tbody>
                            ${bill.items.map(item => `
                                <tr>
                                    <td>
                                        <div style="font-weight: 500">${item.description}</div>
                                        <div style="font-size: 12px; color: #64748b">${item.category}</div>
                                    </td>
                                    <td style="text-align: right">₹${item.totalPrice.toFixed(2)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>

                    <div class="totals">
                        <div class="totals-row"><span>Subtotal</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
                        <div class="totals-row"><span>CGST (9%)</span><span>₹${(bill.taxAmount / 2).toFixed(2)}</span></div>
                        <div class="totals-row"><span>SGST (9%)</span><span>₹${(bill.taxAmount / 2).toFixed(2)}</span></div>
                        <div class="totals-row final"><span>Total</span><span>₹${bill.totalAmount.toFixed(2)}</span></div>
                        <div class="totals-row" style="color: #166534"><span>Paid Amount</span><span>-₹${bill.paidAmount.toFixed(2)}</span></div>
                        <div class="totals-row" style="color: #ef4444"><span>Balance Due</span><span>₹${bill.balanceDue.toFixed(2)}</span></div>
                    </div>
                     
                    <div style="margin-top: 20px; text-align: right;">
                        <span class="badge ${bill.balanceDue <= 0 ? 'paid' : 'pending'}">
                            ${bill.balanceDue <= 0 ? '✓ PAID & VERIFIED' : 'PENDING PAYMENT'}
                        </span>
                    </div>

                    <div class="footer">
                        <p>This is a computer generated invoice.</p>
                        <p>MedFlow Healthcare Systems • Mumbai, India</p>
                    </div>

                    <div class="no-print" style="position: fixed; top: 20px; right: 20px;">
                        <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">Download / Print PDF</button>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        {viewMode === 'details' ? (
                            <Button variant="ghost" size="sm" className="-ml-2" onClick={() => setViewMode('summary')}>
                                <X className="w-5 h-5 mr-1" /> Back
                            </Button>
                        ) : <Receipt className="w-6 h-6 text-primary" />}
                        {viewMode === 'details' ? `Bills - ${selectedPatientBills?.patient.name}` : 'Billing Overview'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {viewMode === 'details' ? `UHID: ${selectedPatientBills?.patient.uhid}` : 'Manage outstanding payments per patient'}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchBills}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="kpi-card border-l-4 border-l-status-success"><p className="text-xs text-muted-foreground">Today&apos;s Revenue</p><p className="text-2xl font-bold text-status-success">{formatCurrency(stats.todayRevenue)}</p></div>
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">Total Pending</p><p className="text-2xl font-bold text-status-warning">{formatCurrency(stats.pendingAmount)}</p></div>
            </div>

            <div className="floating-card overflow-hidden">
                {loading ? <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : bills.length === 0 ? <p className="text-center text-muted-foreground py-8">No billing records found</p> : (
                    viewMode === 'summary' ? (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Patient</th>
                                    <th className="text-center p-3 text-xs font-medium text-muted-foreground">Total Bills</th>
                                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Total Paid</th>
                                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Total Pending</th>
                                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {Object.values(patientSummary).map((data) => (
                                    <tr key={data.patient.uhid} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handlePatientClick(data.patient.uhid)}>
                                        <td className="p-3">
                                            <p className="font-medium text-sm">{data.patient.name}</p>
                                            <p className="text-xs text-muted-foreground">{data.patient.uhid}</p>
                                        </td>
                                        <td className="p-3 text-center text-sm">{data.billCount}</td>
                                        <td className="p-3 text-right text-status-success">{formatCurrency(data.totalPaid)}</td>
                                        <td className="p-3 text-right">
                                            <span className={cn("font-bold", data.totalPending > 0 ? "text-status-warning" : "text-muted-foreground")}>
                                                {formatCurrency(data.totalPending)}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <Button size="sm" variant="ghost">View Details</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr><th className="text-left p-3 text-xs font-medium text-muted-foreground">Bill #</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Date</th><th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Amount</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Balance</th><th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {selectedPatientBills?.bills.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono text-sm">{bill.billNumber}</td>
                                        <td className="p-3 text-sm">{new Date(bill.createdAt).toLocaleDateString()}</td>
                                        <td className="p-3"><span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(bill.status))}>{bill.status}</span></td>
                                        <td className="p-3 text-right font-medium">{formatCurrency(bill.totalAmount)}</td>
                                        <td className="p-3 text-right text-status-warning font-medium">{formatCurrency(bill.balanceDue)}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="outline" size="sm" onClick={() => handlePrintInvoice(bill)}>Invoice</Button>
                                                {bill.balanceDue > 0 && <Button size="sm" onClick={() => openPayment(bill)}><CreditCard className="w-4 h-4 mr-1" />Pay</Button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )
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
