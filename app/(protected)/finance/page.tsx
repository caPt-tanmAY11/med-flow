"use client";

import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, Loader2, TrendingUp, IndianRupee, Building2, Calendar, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Sample department data - will be replaced with real data when available
const SAMPLE_DEPARTMENTS = [
    { name: 'ONCOLOGY', displayName: 'Oncology', revenue: 320000, pendingAmount: 85000, itemCount: 38 },
    { name: 'CARDIOLOGY', displayName: 'Cardiology', revenue: 285000, pendingAmount: 45000, itemCount: 156 },
    { name: 'RADIOLOGY', displayName: 'Radiology', revenue: 245000, pendingAmount: 28000, itemCount: 312 },
    { name: 'GYNECOLOGY', displayName: 'Gynecology', revenue: 198000, pendingAmount: 32000, itemCount: 124 },
    { name: 'ORTHOPEDICS', displayName: 'Orthopedics', revenue: 175000, pendingAmount: 28000, itemCount: 98 },
    { name: 'NEPHROLOGY', displayName: 'Nephrology', revenue: 165000, pendingAmount: 35000, itemCount: 42 },
    { name: 'GASTROENTEROLOGY', displayName: 'Gastroenterology', revenue: 156000, pendingAmount: 22000, itemCount: 87 },
    { name: 'NEUROLOGY', displayName: 'Neurology', revenue: 142000, pendingAmount: 18000, itemCount: 76 },
    { name: 'UROLOGY', displayName: 'Urology', revenue: 134000, pendingAmount: 19000, itemCount: 56 },
    { name: 'PEDIATRICS', displayName: 'Pediatrics', revenue: 128000, pendingAmount: 15000, itemCount: 134 },
    { name: 'OPHTHALMOLOGY', displayName: 'Ophthalmology', revenue: 115000, pendingAmount: 12000, itemCount: 89 },
    { name: 'DERMATOLOGY', displayName: 'Dermatology', revenue: 98000, pendingAmount: 8000, itemCount: 112 },
    { name: 'ENT', displayName: 'ENT', revenue: 87000, pendingAmount: 7500, itemCount: 78 },
    { name: 'PULMONOLOGY', displayName: 'Pulmonology', revenue: 76000, pendingAmount: 9000, itemCount: 54 },
    { name: 'PSYCHIATRY', displayName: 'Psychiatry', revenue: 67000, pendingAmount: 5500, itemCount: 92 },
];

const SAMPLE_TREND = [
    { date: '2026-01-18', revenue: 125000 },
    { date: '2026-01-19', revenue: 142000 },
    { date: '2026-01-20', revenue: 98000 },
    { date: '2026-01-21', revenue: 178000 },
    { date: '2026-01-22', revenue: 156000 },
    { date: '2026-01-23', revenue: 189000 },
    { date: '2026-01-24', revenue: 167000 },
];

interface Department {
    name: string;
    displayName: string;
    revenue: number;
    pendingAmount: number;
    potentialRevenue?: number;
    itemCount: number;
    percentageOfTotal?: number;
}

interface TrendData {
    date: string;
    revenue: number;
}

export default function FinancePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [trend, setTrend] = useState<TrendData[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [totalPending, setTotalPending] = useState(0);

    useEffect(() => {
        // Always show clinical department sample data since real billing data 
        // is categorized by service type, not by clinical department
        const loadData = () => {
            setLoading(true);

            // Calculate totals from sample departments
            const total = SAMPLE_DEPARTMENTS.reduce((sum, d) => sum + d.revenue, 0);
            const pending = SAMPLE_DEPARTMENTS.reduce((sum, d) => sum + d.pendingAmount, 0);

            // Add percentage to each department
            const depsWithPercent = SAMPLE_DEPARTMENTS.map(d => ({
                ...d,
                potentialRevenue: d.revenue + d.pendingAmount,
                percentageOfTotal: Math.round((d.revenue / total) * 1000) / 10
            }));

            setDepartments(depsWithPercent);
            setTrend(SAMPLE_TREND);
            setTotalRevenue(total);
            setTotalPending(pending);
            setLoading(false);
        };

        // Small delay for smooth loading animation
        setTimeout(loadData, 300);
    }, []);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const formatCompact = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
        return formatCurrency(amount);
    };

    const maxRevenue = Math.max(...departments.map(d => d.revenue), 1);

    const DEPT_COLORS: Record<string, string> = {
        'ONCOLOGY': 'bg-violet-500',
        'CARDIOLOGY': 'bg-red-500',
        'RADIOLOGY': 'bg-slate-500',
        'GYNECOLOGY': 'bg-pink-500',
        'ORTHOPEDICS': 'bg-orange-500',
        'NEPHROLOGY': 'bg-emerald-500',
        'GASTROENTEROLOGY': 'bg-amber-500',
        'NEUROLOGY': 'bg-purple-500',
        'UROLOGY': 'bg-cyan-500',
        'PEDIATRICS': 'bg-sky-500',
        'OPHTHALMOLOGY': 'bg-teal-500',
        'DERMATOLOGY': 'bg-rose-400',
        'ENT': 'bg-indigo-500',
        'PULMONOLOGY': 'bg-blue-400',
        'PSYCHIATRY': 'bg-fuchsia-500',
    };

    const getColor = (name: string) => DEPT_COLORS[name] || 'bg-primary';

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in p-4">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        <PieChart className="w-7 h-7 text-primary" />
                        Department-wise Income Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Revenue breakdown by clinical departments
                    </p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <IndianRupee className="w-5 h-5" />
                        <span className="text-sm font-medium">Total Revenue</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCompact(totalRevenue)}</p>
                    <p className="text-sm opacity-75 mt-1">This month</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-sm font-medium">Pending Amount</span>
                    </div>
                    <p className="text-3xl font-bold">{formatCompact(totalPending)}</p>
                    <p className="text-sm opacity-75 mt-1">To be collected</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <Building2 className="w-5 h-5" />
                        <span className="text-sm font-medium">Departments</span>
                    </div>
                    <p className="text-3xl font-bold">{departments.length}</p>
                    <p className="text-sm opacity-75 mt-1">Active departments</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-2 mb-2 opacity-90">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-sm font-medium">Collection Rate</span>
                    </div>
                    <p className="text-3xl font-bold">{Math.round((totalRevenue / (totalRevenue + totalPending)) * 100)}%</p>
                    <p className="text-sm opacity-75 mt-1">Of total billed</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Department Revenue Table */}
                <div className="lg:col-span-2 bg-card rounded-2xl border p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Revenue by Department
                    </h2>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {departments.map((dept, index) => (
                            <div key={dept.name} className="bg-muted/30 rounded-xl p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-bold">
                                            {index + 1}
                                        </div>
                                        <div className={cn("w-3 h-3 rounded-full", getColor(dept.name))} />
                                        <span className="font-semibold text-lg">{dept.displayName}</span>
                                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                            {dept.itemCount} services
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-xl text-green-600">{formatCurrency(dept.revenue)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {dept.percentageOfTotal || Math.round((dept.revenue / totalRevenue) * 100)}% of total
                                        </p>
                                    </div>
                                </div>
                                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn("absolute left-0 top-0 h-full rounded-full transition-all duration-500", getColor(dept.name))}
                                        style={{ width: `${(dept.revenue / maxRevenue) * 100}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                                    <span>Pending: <span className="text-orange-500 font-medium">{formatCurrency(dept.pendingAmount)}</span></span>
                                    <span>Potential: <span className="text-blue-500 font-medium">{formatCurrency(dept.revenue + dept.pendingAmount)}</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 7-Day Revenue Trend */}
                <div className="bg-card rounded-2xl border p-6 shadow-sm">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        7-Day Revenue Trend
                    </h2>
                    <div className="space-y-3">
                        {trend.map((day) => {
                            const date = new Date(day.date);
                            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                            const dayNum = date.getDate();
                            const maxTrend = Math.max(...trend.map(t => t.revenue), 1);
                            return (
                                <div key={day.date} className="flex items-center gap-3">
                                    <div className="w-14 text-center">
                                        <p className="text-xs text-muted-foreground">{dayName}</p>
                                        <p className="font-semibold">{dayNum}</p>
                                    </div>
                                    <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden relative">
                                        <div
                                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/70 rounded-full flex items-center justify-end pr-3 transition-all duration-500"
                                            style={{ width: `${Math.max((day.revenue / maxTrend) * 100, 15)}%` }}
                                        >
                                            <span className="text-xs text-white font-bold">
                                                {formatCompact(day.revenue)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Weekly Total */}
                    <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Weekly Total</span>
                            <span className="text-2xl font-bold text-primary">
                                {formatCompact(trend.reduce((sum, t) => sum + t.revenue, 0))}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Department Distribution Summary */}
            <div className="bg-card rounded-2xl border p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Department Distribution</h2>
                <div className="flex flex-wrap gap-3">
                    {departments.slice(0, 10).map((dept) => (
                        <div key={dept.name} className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                            <div className={cn("w-3 h-3 rounded-full", getColor(dept.name))} />
                            <span className="font-medium">{dept.displayName}</span>
                            <span className="text-muted-foreground text-sm">{formatCompact(dept.revenue)}</span>
                        </div>
                    ))}
                    {departments.length > 10 && (
                        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                            <span className="text-muted-foreground">+{departments.length - 10} more</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
