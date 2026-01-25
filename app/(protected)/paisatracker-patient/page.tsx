"use client";

import { useEffect, useState } from 'react';
import {
    Wallet, Receipt, CreditCard, Clock, CheckCircle,
    AlertTriangle, Loader2, IndianRupee, History, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
    items: { category: string; description: string; totalPrice: number }[];
    payments: { amount: number; paymentMode: string; receivedAt: string }[];
}

export default function PaisaTrackerPatientPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [bills, setBills] = useState<Bill[]>([]);
    const [stats, setStats] = useState({ totalPending: 0, totalPaid: 0 });
    const [patientId, setPatientId] = useState<string>('');
    const [patientName, setPatientName] = useState<string>('');
    const [patientUhid, setPatientUhid] = useState<string>('');

    // Payment Modal State
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [processingPayment, setProcessingPayment] = useState(false);

    // 1. Fetch Demo Patient
    const fetchPatient = async () => {
        try {
            const response = await fetch('/api/patients?limit=1');
            const result = await response.json();
            if (result.data && result.data.length > 0) {
                const p = result.data[0];
                setPatientId(p.id);
                setPatientName(p.name);
                setPatientUhid(p.uhid);
            }
        } catch (error) {
            console.error('Error fetching patient:', error);
            toast({ title: 'Error', description: 'Failed to load patient profile', variant: 'destructive' });
        }
    };

    // 2. Fetch Bills for Patient
    const fetchBills = async () => {
        if (!patientId) return;
        setLoading(true);
        try {
            // Filter by current patient ID
            const response = await fetch(`/api/billing?patientId=${patientId}`);
            const result = await response.json();
            const patientBills: Bill[] = result.data || [];

            setBills(patientBills);

            // Calculate stats
            const pending = patientBills.reduce((sum, b) => sum + b.balanceDue, 0);
            const paid = patientBills.reduce((sum, b) => sum + b.paidAmount, 0);
            setStats({ totalPending: pending, totalPaid: paid });
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            toast({ title: 'Error', description: 'Failed to load bills', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatient();
    }, []);

    useEffect(() => {
        if (patientId) fetchBills();
    }, [patientId]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
            partial: 'bg-blue-100 text-blue-700 border-blue-200',
            paid: 'bg-green-100 text-green-700 border-green-200',
            cancelled: 'bg-gray-100 text-gray-500 border-gray-200'
        };
        return styles[status] || styles.cancelled;
    };

    // Handle Online Payment (Mock)
    const handlePayOnline = async () => {
        if (!selectedBill) return;
        setProcessingPayment(true);

        // Mock gateway delay
        await new Promise(r => setTimeout(r, 1500));

        try {
            const response = await fetch(`/api/billing/${selectedBill.id}?action=payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: selectedBill.balanceDue,
                    paymentMode: 'online', // UPI/Card
                    receivedBy: 'Payment Gateway'
                })
            });

            if (response.ok) {
                toast({
                    title: 'Payment Successful',
                    description: `Paid ${formatCurrency(selectedBill.balanceDue)} via Order #${selectedBill.billNumber}`,
                    variant: 'default'
                });
                setShowPaymentModal(false);
                setSelectedBill(null);
                fetchBills(); // Refresh list
            } else {
                throw new Error('Payment failed');
            }
        } catch (error) {
            toast({ title: 'Transaction Failed', description: 'Could not process payment. Try again.', variant: 'destructive' });
        } finally {
            setProcessingPayment(false);
        }
    };

    return (
        <div className="container max-w-5xl mx-auto py-8 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Wallet className="w-8 h-8" />
                        PaisaTracker
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Billing Portal for <span className="font-semibold text-foreground">{patientName}</span> ({patientUhid})
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={fetchBills}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border bg-card shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Outstanding</p>
                        <h2 className={cn("text-3xl font-bold mt-2", stats.totalPending > 0 ? "text-red-500" : "text-green-600")}>
                            {formatCurrency(stats.totalPending)}
                        </h2>
                    </div>
                    <div className={cn("p-4 rounded-full", stats.totalPending > 0 ? "bg-red-50" : "bg-green-50")}>
                        <AlertTriangle className={cn("w-6 h-6", stats.totalPending > 0 ? "text-red-500" : "text-green-600")} />
                    </div>
                </div>
                <div className="p-6 rounded-xl border bg-card shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Paid</p>
                        <h2 className="text-3xl font-bold mt-2 text-primary">
                            {formatCurrency(stats.totalPaid)}
                        </h2>
                    </div>
                    <div className="p-4 rounded-full bg-primary/10">
                        <CheckCircle className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>

            {/* Bills List */}
            <div className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-muted-foreground" />
                    Transaction History
                </h2>

                {loading && bills.length === 0 ? (
                    <div className="p-12 flex justify-center text-muted-foreground">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : bills.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed rounded-xl text-muted-foreground">
                        No billing history found.
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {bills.map((bill) => (
                            <div key={bill.id} className="p-5 rounded-xl border bg-card hover:shadow-md transition-shadow relative overflow-hidden">
                                {/* Status Stripe */}
                                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5",
                                    bill.balanceDue > 0 ? "bg-red-500" : "bg-green-500"
                                )}></div>

                                <div className="flex flex-col md:flex-row justify-between gap-4 pl-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-mono font-bold text-lg">{bill.billNumber}</h3>
                                            <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getStatusBadge(bill.status))}>
                                                {bill.status}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" />
                                            {new Date(bill.createdAt).toLocaleDateString()} at {new Date(bill.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="text-sm mt-2">
                                            {bill.items.map(i => i.description).join(', ')}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2 min-w-[150px]">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Amount</p>
                                            <p className="text-xl font-bold">{formatCurrency(bill.totalAmount)}</p>
                                        </div>

                                        {bill.balanceDue > 0 ? (
                                            <Button
                                                className="w-full md:w-auto bg-primary hover:bg-primary/90"
                                                onClick={() => { setSelectedBill(bill); setShowPaymentModal(true); }}
                                            >
                                                <CreditCard className="w-4 h-4 mr-2" />
                                                Pay Now
                                            </Button>
                                        ) : (
                                            <div className="flex items-center text-green-600 text-sm font-medium bg-green-50 px-3 py-1.5 rounded-lg">
                                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                                Paid
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Payment Modal */}
            {showPaymentModal && selectedBill && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
                    <div className="bg-background rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <h2 className="text-2xl font-bold">Secure Payment</h2>
                            <p className="text-muted-foreground">Paying for Invoice {selectedBill.billNumber}</p>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-xl space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>Total Amount</span>
                                <span className="font-medium">{formatCurrency(selectedBill.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Previously Paid</span>
                                <span className="text-green-600">{formatCurrency(selectedBill.paidAmount)}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-bold text-lg">
                                <span>To Pay</span>
                                <span>{formatCurrency(selectedBill.balanceDue)}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="h-auto py-3 flex flex-col gap-1 border-primary/50 bg-primary/5">
                                    <CreditCard className="w-5 h-5 text-primary" />
                                    <span className="text-xs font-medium">Card</span>
                                </Button>
                                <Button variant="outline" className="h-auto py-3 flex flex-col gap-1">
                                    <IndianRupee className="w-5 h-5" />
                                    <span className="text-xs font-medium">UPI</span>
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowPaymentModal(false)}>
                                Cancel
                            </Button>
                            <Button
                                className="flex-1"
                                onClick={handlePayOnline}
                                disabled={processingPayment}
                            >
                                {processingPayment ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Processing...
                                    </>
                                ) : (
                                    'Pay Securely'
                                )}
                            </Button>
                        </div>

                        <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            This is a secure mock payment gateway
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
