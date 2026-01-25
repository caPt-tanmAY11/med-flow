"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    Bed, Users, Stethoscope, AlertTriangle, FlaskConical,
    Receipt, TrendingUp, Clock, Activity, ArrowUpRight,
    Calendar, HeartPulse, Pill, ChevronRight, RefreshCw, Loader2,
    ShieldCheck, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
        total: number; // Added total to match usage if needed, or derived
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
            <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                    <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const stats = [
        {
            title: 'Bed Occupancy',
            value: `${data?.beds.occupancyRate || 0}%`,
            icon: Bed,
            gradient: 'from-blue-500 to-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
            change: `${data?.beds.available || 0} available`,
            positive: true
        },
        {
            title: 'Today Admissions',
            value: data?.todayAdmissions || 0,
            icon: Users,
            gradient: 'from-teal-500 to-teal-600',
            bg: 'bg-teal-50 dark:bg-teal-900/20',
            text: 'text-teal-600 dark:text-teal-400',
            change: `${data?.todayDischarges || 0} discharged`,
            positive: true
        },
        {
            title: 'Active Encounters',
            value: (data?.encounters.opd || 0) + (data?.encounters.ipd || 0) + (data?.encounters.emergency || 0),
            icon: Stethoscope,
            gradient: 'from-violet-500 to-violet-600',
            bg: 'bg-violet-50 dark:bg-violet-900/20',
            text: 'text-violet-600 dark:text-violet-400',
            change: `${data?.encounters.emergency || 0} emergency`,
            positive: true
        },
        {
            title: 'Critical Alerts',
            value: data?.criticalAlerts || 0,
            icon: AlertTriangle,
            gradient: 'from-rose-500 to-rose-600',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            text: 'text-rose-600 dark:text-rose-400',
            change: 'Action Required',
            positive: false
        },
    ];

    const secondaryStats = [
        { title: 'Pending Orders', value: data?.pendingOrders || 0, icon: FlaskConical, color: 'text-amber-600' },
        { title: 'Low Stock Items', value: data?.lowStockCount || 0, icon: Receipt, color: 'text-rose-600' },
        { title: 'Surgeries Today', value: data?.surgeriesToday || 0, icon: TrendingUp, color: 'text-teal-600' },
        { title: 'Recent Incidents', value: data?.recentIncidents || 0, icon: Clock, color: 'text-slate-500' },
    ];

    const quickActions = [
        { title: 'New Patient', icon: Users, href: '/registration' },
        { title: 'View Beds', icon: Bed, href: '/beds' },
        { title: 'Lab Results', icon: FlaskConical, href: '/lab' },
        { title: 'Pharmacy', icon: Pill, href: '/pharmacy' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-10 font-sans text-slate-900 dark:text-slate-50">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10"
            >
                <div>
                     <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400">
                             <Activity className="w-6 h-6" />
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Dashboard</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">
                        Real-time overview of hospital operations.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <button
                        onClick={() => fetchDashboard(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                        disabled={refreshing}
                    >
                        <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
                        {refreshing ? 'Syncing...' : 'Refresh Data'}
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date().toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </motion.div>

            {/* Primary Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        className="relative group overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110", stat.gradient)} />
                        
                        <div className="flex items-center justify-between mb-6">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 dark:shadow-none transition-transform group-hover:scale-110",
                                stat.bg, stat.text
                            )}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border",
                                stat.positive 
                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800" 
                                    : "bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-800"
                            )}>
                                {stat.positive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                                {stat.change}
                            </span>
                        </div>
                        
                        <div>
                            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 mb-1 tracking-wide uppercase">{stat.title}</p>
                            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Secondary KPIs */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
                {secondaryStats.map((stat, i) => (
                    <div key={stat.title} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:border-blue-200 dark:hover:border-blue-800 transition-colors group">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-colors", stat.color)}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg font-bold text-slate-900 dark:text-white">{stat.value}</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.title}</span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Detailed Sections Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Staff Section */}
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                                <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Staff on Duty</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{data?.staffOnDuty.total || 0} active currently</p>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4 flex-1">
                        {[
                            { label: 'Morning Shift', value: data?.staffOnDuty.morning || 0, color: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-700' },
                            { label: 'Evening Shift', value: data?.staffOnDuty.evening || 0, color: 'bg-indigo-500', bg: 'bg-indigo-100', text: 'text-indigo-700' },
                            { label: 'Night Shift', value: data?.staffOnDuty.night || 0, color: 'bg-slate-600', bg: 'bg-slate-200', text: 'text-slate-700' },
                        ].map((item) => (
                            <div key={item.label} className="group flex items-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shadow-sm transition-all">
                                <div className={cn("w-3 h-3 rounded-full mr-4 ring-4 ring-opacity-20", item.color, item.color.replace('bg-', 'ring-'))} />
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex-1">{item.label}</span>
                                <span className="text-lg font-bold text-slate-900 dark:text-white">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Alerts Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Alerts</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Requires attention</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400">
                            {(data?.criticalAlerts || 0) + (data?.lowStockCount || 0)} Total
                        </span>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/50 group hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                                    </span>
                                    <span className="text-sm font-bold text-rose-700 dark:text-rose-400">Critical Alerts</span>
                                </div>
                                <span className="text-xl font-bold text-rose-900 dark:text-rose-300">{data?.criticalAlerts || 0}</span>
                            </div>
                            <p className="text-xs text-rose-600/80 dark:text-rose-400/80 mt-2 pl-6 font-medium">High priority system notifications</p>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/50 group hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="h-3 w-3 rounded-full bg-amber-500" />
                                    <span className="text-sm font-bold text-amber-700 dark:text-amber-400">Low Stock</span>
                                </div>
                                <span className="text-xl font-bold text-amber-900 dark:text-amber-300">{data?.lowStockCount || 0}</span>
                            </div>
                            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-2 pl-6 font-medium">Inventory items below reorder level</p>
                        </div>
                        
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 group hover:shadow-md transition-all cursor-pointer">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="h-3 w-3 rounded-full bg-slate-400" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Pending Orders</span>
                                </div>
                                <span className="text-xl font-bold text-slate-900 dark:text-white">{data?.pendingOrders || 0}</span>
                            </div>
                             <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 pl-6 font-medium">Purchase orders pending approval</p>
                        </div>
                    </div>
                </motion.div>

                {/* Quick Actions */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 flex flex-col relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none" />
                    
                    <div className="relative z-10 mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                            Quick Actions
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Frequently used modules</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 relative z-10 flex-1">
                        {quickActions.map((action) => (
                            <a
                                key={action.title}
                                href={action.href}
                                className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:border-blue-200 dark:hover:border-blue-600/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group text-center"
                            >
                                <div className="p-3 rounded-xl bg-white dark:bg-slate-900 shadow-sm mb-3 group-hover:scale-110 transition-transform">
                                     <action.icon className="w-6 h-6 text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors" />
                                </div>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{action.title}</span>
                            </a>
                        ))}
                    </div>
                </motion.div>
            </div>

            {data?.lastUpdated && (
                <div className="flex justify-center pt-8 opacity-60 hover:opacity-100 transition-opacity">
                    <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium border border-slate-200 dark:border-slate-700">
                        <Clock className="w-3 h-3" />
                         Last synced: {new Date(data.lastUpdated).toLocaleTimeString()}
                    </span>
                </div>
            )}
        </div>
    );
}
