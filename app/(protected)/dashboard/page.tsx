"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Bed, Users, Stethoscope, AlertTriangle, FlaskConical,
    Receipt, TrendingUp, Clock, Activity, ArrowUpRight,
    Calendar, HeartPulse, Pill, ChevronRight, RefreshCw, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardData {
    beds: {
        total: number;
        available: number;
        occupied: number;
        cleaning: number;
        maintenance: number;
        occupancyRate: number;
    };
    encounters: {
        opd: number;
        ipd: number;
        emergency: number;
    };
    todayAdmissions: number;
    todayDischarges: number;
    pendingOrders: number;
    criticalAlerts: number;
    lowStockCount: number;
    staffOnDuty: {
        morning: number;
        evening: number;
        night: number;
        total: number;
    };
    recentIncidents: number;
    surgeriesToday: number;
    lastUpdated: string;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState<DashboardData | null>(null);

    const fetchDashboard = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await fetch('/api/dashboard');
            const result = await response.json();
            if (result.data) setData(result.data);
        } catch (error) {
            console.error('Failed to fetch dashboard:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(() => fetchDashboard(true), 60000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const stats = [
        {
            title: 'Bed Occupancy',
            value: `${data?.beds.occupancyRate || 0}%`,
            icon: Bed,
            color: 'from-primary/80 to-teal-600/80',
            change: `${data?.beds.available || 0} available`,
            positive: true
        },
        {
            title: 'Today Admissions',
            value: data?.todayAdmissions || 0,
            icon: Users,
            color: 'from-green-500 to-emerald-600',
            change: `${data?.todayDischarges || 0} discharged`,
            positive: true
        },
        {
            title: 'Active Encounters',
            value: (data?.encounters.opd || 0) + (data?.encounters.ipd || 0) + (data?.encounters.emergency || 0),
            icon: Stethoscope,
            color: 'from-blue-500 to-cyan-600',
            change: `${data?.encounters.emergency || 0} emergency`,
            positive: true
        },
        {
            title: 'Critical Alerts',
            value: data?.criticalAlerts || 0,
            icon: AlertTriangle,
            color: 'from-red-500 to-rose-600',
            change: 'Unacknowledged',
            positive: false
        },
    ];

    const secondaryStats = [
        { title: 'Pending Orders', value: data?.pendingOrders || 0, icon: FlaskConical, color: 'text-status-warning' },
        { title: 'Low Stock Items', value: data?.lowStockCount || 0, icon: Receipt, color: 'text-status-pending' },
        { title: 'Surgeries Today', value: data?.surgeriesToday || 0, icon: TrendingUp, color: 'text-status-success' },
        { title: 'Recent Incidents', value: data?.recentIncidents || 0, icon: Clock, color: 'text-muted-foreground' },
    ];

    const quickActions = [
        { title: 'New Patient', icon: Users, href: '/registration' },
        { title: 'View Beds', icon: Bed, href: '/beds' },
        { title: 'Lab Results', icon: FlaskConical, href: '/lab' },
        { title: 'Pharmacy', icon: Pill, href: '/pharmacy' },
    ];

    return (
        <div className="space-y-8 animate-fade-in pb-10 font-inter">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-inter text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-2 text-base">
                        Overview of hospital operations and key performance indicators.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-sm">
                    <button
                        onClick={() => fetchDashboard(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                    <div className="h-6 w-px bg-slate-200" />
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className="relative group overflow-hidden rounded-2xl bg-white p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110", stat.color)} />
                        
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/10",
                                "bg-gradient-to-br", stat.color
                            )}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
                                stat.positive 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : "bg-rose-50 text-rose-700 border-rose-100"
                            )}>
                                {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {stat.change}
                            </span>
                        </div>
                        
                        <div>
                            <p className="text-sm font-medium text-slate-500 mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {secondaryStats.map((stat) => (
                    <div key={stat.title} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-100 transition-colors">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">{stat.value}</span>
                            <span className="text-xs font-medium text-slate-400">{stat.title}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Sections Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Staff Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                <Users className="w-5 h-5 text-violet-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Staff on Duty</h3>
                                <p className="text-xs text-slate-500">{data?.staffOnDuty.total || 0} active currently</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 flex-1">
                        {[
                            { label: 'Morning Shift', value: data?.staffOnDuty.morning || 0, color: 'bg-amber-400', bg: 'bg-amber-50' },
                            { label: 'Evening Shift', value: data?.staffOnDuty.evening || 0, color: 'bg-indigo-400', bg: 'bg-indigo-50' },
                            { label: 'Night Shift', value: data?.staffOnDuty.night || 0, color: 'bg-slate-700', bg: 'bg-slate-100' },
                        ].map((item) => (
                            <div key={item.label} className="group flex items-center p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                                <div className={cn("w-3 h-3 rounded-full mr-3 ring-4 ring-opacity-20", item.color, item.color.replace('bg-', 'ring-'))} />
                                <span className="text-sm font-medium text-slate-600 flex-1">{item.label}</span>
                                <span className="text-lg font-bold text-slate-900">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerts Section */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Active Alerts</h3>
                                <p className="text-xs text-slate-500">Requires attention</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                            {(data?.criticalAlerts || 0) + (data?.lowStockCount || 0)} Total
                        </span>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 group hover:shadow-sm transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                                    </span>
                                    <span className="text-sm font-bold text-rose-700">Critical Alerts</span>
                                </div>
                                <span className="text-xl font-bold text-rose-900">{data?.criticalAlerts || 0}</span>
                            </div>
                            <p className="text-xs text-rose-600/80 mt-1 pl-4.5">High priority system notifications</p>
                        </div>

                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 group hover:shadow-sm transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                    <span className="text-sm font-bold text-amber-700">Low Stock</span>
                                </div>
                                <span className="text-xl font-bold text-amber-900">{data?.lowStockCount || 0}</span>
                            </div>
                            <p className="text-xs text-amber-600/80 mt-1 pl-4.5">Inventory items below reorder level</p>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 group hover:shadow-sm transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                                    <span className="text-sm font-bold text-slate-700">Pending Orders</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900">{data?.pendingOrders || 0}</span>
                            </div>
                             <p className="text-xs text-slate-500 mt-1 pl-4.5">Purchase orders pending approval</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="relative z-10 mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                            <Activity className="w-5 h-5 text-indigo-600" />
                            Quick Actions
                        </h3>
                        <p className="text-slate-500 text-sm">Frequently used modules</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 relative z-10 flex-1">
                        {quickActions.map((action) => (
                            <a
                                key={action.title}
                                href={action.href}
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 group text-center"
                            >
                                <action.icon className="w-6 h-6 text-indigo-500 group-hover:text-indigo-600 mb-2 transition-colors" />
                                <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">{action.title}</span>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {data?.lastUpdated && (
                <div className="flex justify-center pt-4">
                    <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-400 text-xs font-medium border border-slate-200">
                        Last updated {new Date(data.lastUpdated).toLocaleTimeString()}
                    </span>
                </div>
            )}
        </div>
    );
}
