'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Receipt,
    CreditCard,
    Building2,
    FileText,
    TrendingDown,
    AlertCircle,
    CheckCircle2,
    Clock,
    IndianRupee,
    Stethoscope,
    FlaskConical,
    Pill,
    Bed,
    Activity,
    Ambulance,
} from 'lucide-react';

// Category icons mapping
const categoryIcons: Record<string, React.ReactNode> = {
    CONSULTATION: <Stethoscope className="h-4 w-4" />,
    LAB: <FlaskConical className="h-4 w-4" />,
    PHARMACY: <Pill className="h-4 w-4" />,
    ROOM: <Bed className="h-4 w-4" />,
    PROCEDURE: <Activity className="h-4 w-4" />,
    EMERGENCY: <Ambulance className="h-4 w-4" />,
    RADIOLOGY: <FileText className="h-4 w-4" />,
    MISC: <Building2 className="h-4 w-4" />,
};

// Category colors
const categoryColors: Record<string, string> = {
    CONSULTATION: 'bg-blue-100 text-blue-800',
    LAB: 'bg-purple-100 text-purple-800',
    PHARMACY: 'bg-green-100 text-green-800',
    ROOM: 'bg-orange-100 text-orange-800',
    PROCEDURE: 'bg-red-100 text-red-800',
    EMERGENCY: 'bg-rose-100 text-rose-800',
    RADIOLOGY: 'bg-indigo-100 text-indigo-800',
    MISC: 'bg-gray-100 text-gray-800',
};

interface Bill {
    id: string;
    billNumber: string;
    status: string;
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balanceDue: number;
    createdAt: string;
    finalizedAt?: string;
    encounter: {
        id: string;
        type: string;
        admissionTime?: string;
        dischargeTime?: string;
    };
    items: Array<{
        id: string;
        category: string;
        itemCode?: string;
        description: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
    }>;
    payments: Array<{
        id: string;
        amount: number;
        paymentMode: string;
        receivedAt: string;
    }>;
}

interface BillingSummary {
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    categoryBreakdown: Record<string, number>;
}

export default function PatientBillingPage() {
    const [bills, setBills] = useState<Bill[]>([]);
    const [summary, setSummary] = useState<BillingSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
    const [paymentModal, setPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');

    // For demo, we'll use a sample patient ID
    const patientId = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('patientId') || 'demo'
        : 'demo';

    useEffect(() => {
        fetchBillingData();
    }, [patientId]);

    const fetchBillingData = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/billing/aggregate?patientId=${patientId}`);
            const data = await res.json();

            if (data.bills) {
                setBills(data.bills);
                setSummary(data.summary);
            }
        } catch (error) {
            console.error('Failed to fetch billing:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedBill || !paymentAmount) return;

        try {
            const res = await fetch('/api/billing/aggregate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'add-payment',
                    billId: selectedBill.id,
                    amount: parseFloat(paymentAmount),
                    paymentMode,
                    receivedBy: 'SELF'
                })
            });

            if (res.ok) {
                setPaymentModal(false);
                setPaymentAmount('');
                fetchBillingData();
            }
        } catch (error) {
            console.error('Payment failed:', error);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft':
                return <Badge variant="outline" className="bg-yellow-50"><Clock className="h-3 w-3 mr-1" /> Draft</Badge>;
            case 'finalized':
                return <Badge variant="outline" className="bg-blue-50"><FileText className="h-3 w-3 mr-1" /> Finalized</Badge>;
            case 'paid':
                return <Badge variant="outline" className="bg-green-50"><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Receipt className="h-8 w-8 text-primary" />
                        My Bills
                    </h1>
                    <p className="text-muted-foreground mt-1">View and pay your hospital bills</p>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Billed</p>
                                    <p className="text-2xl font-bold">{formatCurrency(summary.totalBilled)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Amount Paid</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalPaid)}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={summary.totalOutstanding > 0 ? 'border-red-200' : ''}>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Outstanding</p>
                                    <p className={`text-2xl font-bold ${summary.totalOutstanding > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                        {formatCurrency(summary.totalOutstanding)}
                                    </p>
                                </div>
                                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${summary.totalOutstanding > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                                    <AlertCircle className={`h-6 w-6 ${summary.totalOutstanding > 0 ? 'text-red-600' : 'text-gray-600'}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Bills</p>
                                    <p className="text-2xl font-bold">{bills.length}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                                    <Receipt className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Category Breakdown */}
            {summary && Object.keys(summary.categoryBreakdown).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Expense Breakdown by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(summary.categoryBreakdown).map(([category, amount]) => (
                                <div key={category} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                                    <div className={`p-2 rounded-full ${categoryColors[category] || 'bg-gray-100'}`}>
                                        {categoryIcons[category] || <Building2 className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{category}</p>
                                        <p className="font-semibold">{formatCurrency(amount)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bills List */}
            <Card>
                <CardHeader>
                    <CardTitle>Bill History</CardTitle>
                    <CardDescription>All your hospital bills and invoices</CardDescription>
                </CardHeader>
                <CardContent>
                    {bills.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>No bills found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {bills.map((bill) => (
                                <Card key={bill.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedBill(bill)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <Receipt className="h-6 w-6 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold">{bill.billNumber}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {bill.encounter.type} • {new Date(bill.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-lg">{formatCurrency(bill.totalAmount)}</p>
                                                <div className="flex items-center gap-2 justify-end">
                                                    {getStatusBadge(bill.status)}
                                                    {bill.balanceDue > 0 && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            Due: {formatCurrency(bill.balanceDue)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Bill Detail Dialog */}
            <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Bill: {selectedBill?.billNumber}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedBill?.encounter.type} on {selectedBill && new Date(selectedBill.createdAt).toLocaleDateString()}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedBill && (
                        <div className="space-y-6">
                            {/* Items Table */}
                            <div>
                                <h4 className="font-semibold mb-2">Bill Items</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Rate</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedBill.items.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Badge variant="secondary" className={categoryColors[item.category]}>
                                                        {categoryIcons[item.category]}
                                                        <span className="ml-1">{item.category}</span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{item.description}</TableCell>
                                                <TableCell className="text-right">{item.quantity}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                                <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <Separator />

                            {/* Totals */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Subtotal</span>
                                    <span>{formatCurrency(selectedBill.subtotal)}</span>
                                </div>
                                {selectedBill.discountAmount > 0 && (
                                    <div className="flex justify-between text-sm text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(selectedBill.discountAmount)}</span>
                                    </div>
                                )}
                                {selectedBill.taxAmount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span>Tax</span>
                                        <span>{formatCurrency(selectedBill.taxAmount)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(selectedBill.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-green-600">
                                    <span>Paid</span>
                                    <span>{formatCurrency(selectedBill.paidAmount)}</span>
                                </div>
                                {selectedBill.balanceDue > 0 && (
                                    <div className="flex justify-between text-red-600 font-semibold">
                                        <span>Balance Due</span>
                                        <span>{formatCurrency(selectedBill.balanceDue)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Payments History */}
                            {selectedBill.payments.length > 0 && (
                                <div>
                                    <h4 className="font-semibold mb-2">Payment History</h4>
                                    <div className="space-y-2">
                                        {selectedBill.payments.map((payment) => (
                                            <div key={payment.id} className="flex justify-between items-center p-2 bg-green-50 rounded">
                                                <div>
                                                    <span className="text-sm">{payment.paymentMode}</span>
                                                    <span className="text-xs text-muted-foreground ml-2">
                                                        {new Date(payment.receivedAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-green-700">{formatCurrency(payment.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        {selectedBill && selectedBill.balanceDue > 0 && (
                            <Button onClick={() => { setPaymentModal(true); setPaymentAmount(selectedBill.balanceDue.toString()); }}>
                                <CreditCard className="h-4 w-4 mr-2" />
                                Pay Now
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Payment Modal */}
            <Dialog open={paymentModal} onOpenChange={setPaymentModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Make Payment</DialogTitle>
                        <DialogDescription>
                            Bill: {selectedBill?.billNumber}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Amount</Label>
                            <div className="relative">
                                <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="pl-10"
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Payment Mode</Label>
                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="CASH">Cash</SelectItem>
                                    <SelectItem value="CARD">Card</SelectItem>
                                    <SelectItem value="UPI">UPI</SelectItem>
                                    <SelectItem value="NETBANKING">Net Banking</SelectItem>
                                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPaymentModal(false)}>Cancel</Button>
                        <Button onClick={handlePayment}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
