"use client";

import { useEffect, useState } from 'react';
import { BarChart3, RefreshCw, Loader2, TrendingUp, TrendingDown, IndianRupee, Building2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Department {
    name: string;
    displayName: string;
    revenue: number;
    pendingAmount: number;
    potentialRevenue: number;
    itemCount: number;
    percentageOfTotal: number;
}

interface RevenueSummary {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    rangeRevenue: number;
    pendingAmount: number;
    totalBilled: number;
    collectionRate: number | string;
}

interface TrendData {
    date: string;
    revenue: number;
}

export default function FinancePage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [summary, setSummary] = useState<RevenueSummary | null>(null);
    const [trend, setTrend] = useState<TrendData[]>([]);
    const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0],
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch department revenue
            const deptParams = new URLSearchParams();
            if (dateRange.from) deptParams.append('from', dateRange.from);
            if (dateRange.to) deptParams.append('to', dateRange.to);

            const [deptResponse, revenueResponse] = await Promise.all([
                fetch(`/api/finance/revenue/department?${deptParams}`),
                fetch(`/api/finance/revenue?${deptParams}`),
            ]);

            const deptData = await deptResponse.json();
            const revenueData = await revenueResponse.json();

            setDepartments(deptData.departments || []);
            setTrend(deptData.trend || []);
            setSummary(revenueData.summary || null);
        } catch (error) {
            console.error('Failed to fetch finance data:', error);
            toast({ title: 'Error', description: 'Failed to load finance data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

    const formatCompact = (amount: number) => {
        if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return formatCurrency(amount);
    };

    const maxRevenue = Math.max(...departments.map(d => d.revenue), 1);
    const maxTrendRevenue = Math.max(...trend.map(t => t.revenue), 1);

    const getDepartmentColor = (name: string): string => {
        const colors: Record<string, string> = {
            // Clinical Departments
            'CARDIOLOGY': 'bg-red-500',
            'GYNECOLOGY': 'bg-pink-500',
            'ORTHOPEDICS': 'bg-orange-500',
            'GASTROENTEROLOGY': 'bg-amber-500',
            'NEUROLOGY': 'bg-purple-500',
            'PEDIATRICS': 'bg-sky-500',
            'DERMATOLOGY': 'bg-rose-400',
            'OPHTHALMOLOGY': 'bg-teal-500',
            'ENT': 'bg-indigo-500',
            'PULMONOLOGY': 'bg-blue-400',
            'NEPHROLOGY': 'bg-emerald-500',
            'UROLOGY': 'bg-cyan-500',
            'ONCOLOGY': 'bg-violet-500',
            'PSYCHIATRY': 'bg-fuchsia-500',
            'RADIOLOGY': 'bg-slate-500',
            'GENERAL_MEDICINE': 'bg-green-500',
            // Service Departments
            'LABORATORY': 'bg-blue-500',
            'PHARMACY': 'bg-green-500',
            'CONSULTATION': 'bg-purple-500',
            'WARD_SERVICES': 'bg-orange-500',
            'SURGERY': 'bg-red-600',
            'EMERGENCY': 'bg-rose-600',
            'PROCEDURES': 'bg-yellow-500',
        };
        return colors[name] || 'bg-primary';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-primary" />
                        Department-wise Income
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Revenue breakdown and analytics by department
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="bg-transparent text-sm border-none focus:outline-none"
                        />
                        <span className="text-muted-foreground">to</span>
                        <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="bg-transparent text-sm border-none focus:outline-none"
                        />
                    </div>
                    <Button variant="outline" size="sm" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="floating-card border-l-4 border-l-status-success">
                            <div className="flex items-center gap-2 mb-2">
                                <IndianRupee className="w-4 h-4 text-status-success" />
                                <span className="text-xs text-muted-foreground">Today&apos;s Revenue</span>
                            </div>
                            <p className="text-2xl font-bold text-status-success">
                                {formatCompact(summary?.todayRevenue || 0)}
                            </p>
                        </div>
                        <div className="floating-card border-l-4 border-l-primary">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-primary" />
                                <span className="text-xs text-muted-foreground">This Month</span>
                            </div>
                            <p className="text-2xl font-bold text-primary">
                                {formatCompact(summary?.monthRevenue || 0)}
                            </p>
                        </div>
                        <div className="floating-card border-l-4 border-l-status-warning">
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingDown className="w-4 h-4 text-status-warning" />
                                <span className="text-xs text-muted-foreground">Pending Amount</span>
                            </div>
                            <p className="text-2xl font-bold text-status-warning">
                                {formatCompact(summary?.pendingAmount || 0)}
                            </p>
                        </div>
                        <div className="floating-card border-l-4 border-l-status-info">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-4 h-4 text-status-info" />
                                <span className="text-xs text-muted-foreground">Collection Rate</span>
                            </div>
                            <p className="text-2xl font-bold text-status-info">
                                {summary?.collectionRate || 0}%
                            </p>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Department Table */}
                        <div className="lg:col-span-2 floating-card">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                Revenue by Department
                            </h3>
                            {departments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No revenue data available</p>
                            ) : (
                                <div className="space-y-3">
                                    {departments.map((dept) => (
                                        <div key={dept.name} className="p-4 bg-muted/30 rounded-xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-3 h-3 rounded-full", getDepartmentColor(dept.name))} />
                                                    <span className="font-medium">{dept.displayName}</span>
                                                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">
                                                        {dept.itemCount} items
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-status-success">{formatCurrency(dept.revenue)}</p>
                                                    <p className="text-xs text-muted-foreground">{dept.percentageOfTotal}% of total</p>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                                                <div
                                                    className={cn("h-full rounded-full transition-all", getDepartmentColor(dept.name))}
                                                    style={{ width: `${(dept.revenue / maxRevenue) * 100}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-xs text-muted-foreground">
                                                <span>Pending: {formatCurrency(dept.pendingAmount)}</span>
                                                <span>Potential: {formatCurrency(dept.potentialRevenue)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Revenue Trend */}
                        <div className="floating-card">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                7-Day Trend
                            </h3>
                            {trend.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No trend data</p>
                            ) : (
                                <div className="space-y-2">
                                    {trend.map((day) => {
                                        const date = new Date(day.date);
                                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                                        const dayNum = date.getDate();
                                        return (
                                            <div key={day.date} className="flex items-center gap-3">
                                                <div className="w-12 text-center">
                                                    <p className="text-xs text-muted-foreground">{dayName}</p>
                                                    <p className="text-sm font-medium">{dayNum}</p>
                                                </div>
                                                <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all flex items-center justify-end pr-2"
                                                        style={{ width: `${Math.max((day.revenue / maxTrendRevenue) * 100, 5)}%` }}
                                                    >
                                                        {day.revenue > 0 && (
                                                            <span className="text-[10px] text-white font-medium">
                                                                {formatCompact(day.revenue)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="floating-card">
                        <h3 className="font-semibold mb-4">Quick Stats</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-muted/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground mb-1">Total Departments</p>
                                <p className="text-2xl font-bold">{departments.length}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground mb-1">Total Billed</p>
                                <p className="text-2xl font-bold">{formatCompact(summary?.totalBilled || 0)}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground mb-1">Week Revenue</p>
                                <p className="text-2xl font-bold">{formatCompact(summary?.weekRevenue || 0)}</p>
                            </div>
                            <div className="p-4 bg-muted/30 rounded-xl text-center">
                                <p className="text-xs text-muted-foreground mb-1">Top Department</p>
                                <p className="text-lg font-bold">{departments[0]?.displayName || '-'}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
