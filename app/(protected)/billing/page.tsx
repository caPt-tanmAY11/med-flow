"use client";

import { Receipt, Clock, CheckCircle, CreditCard } from 'lucide-react';
import { mockBills } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function BillingPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Receipt className="w-6 h-6 text-primary" />
                    Billing
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage patient bills and payments
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Pending Bills</p>
                        <p className="text-lg font-bold">28</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Paid Today</p>
                        <p className="text-lg font-bold">₹4.8L</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Insurance Pending</p>
                        <p className="text-lg font-bold">15</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Monthly Revenue</p>
                        <p className="text-lg font-bold">₹1.25Cr</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Recent Bills</h3>
                <div className="space-y-4">
                    {mockBills.map((bill) => (
                        <div key={bill.id} className="p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="font-medium">{bill.patientName}</p>
                                    <p className="text-xs text-muted-foreground">{bill.uhid}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold">₹{bill.total.toLocaleString()}</p>
                                    <span className={cn(
                                        "status-badge text-xs",
                                        bill.status === 'pending' && "bg-status-warning/10 text-status-warning",
                                        bill.status === 'paid' && "bg-status-success/10 text-status-success",
                                        bill.status === 'partial' && "bg-status-info/10 text-status-info",
                                        bill.status === 'insurance-pending' && "bg-status-pending/10 text-status-pending"
                                    )}>
                                        {bill.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {bill.items.length} items • Discount: ₹{bill.discount}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
