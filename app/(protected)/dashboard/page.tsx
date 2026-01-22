"use client";

import React from 'react';
import { kpiData } from '@/data/mockData';
import { useAuth, roleNames } from '@/context/AuthContext';
import {
    Bed, Users, Stethoscope, AlertTriangle, FlaskConical,
    Receipt, TrendingUp, Clock, Activity, ArrowUpRight,
    Calendar, HeartPulse, Pill, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        {
            title: 'Bed Occupancy',
            value: `${kpiData.bedOccupancy}%`,
            icon: Bed,
            color: 'from-primary/80 to-teal-600/80',
            bgColor: 'bg-primary/10',
            change: '+2.5%',
            positive: true
        },
        {
            title: 'Today Admissions',
            value: kpiData.todayAdmissions,
            icon: Users,
            color: 'from-green-500 to-emerald-600',
            bgColor: 'bg-status-success/10',
            change: '+12',
            positive: true
        },
        {
            title: 'OPD Visits',
            value: kpiData.opdVisits,
            icon: Stethoscope,
            color: 'from-blue-500 to-cyan-600',
            bgColor: 'bg-status-info/10',
            change: '+8%',
            positive: true
        },
        {
            title: 'Critical Patients',
            value: kpiData.criticalPatients,
            icon: AlertTriangle,
            color: 'from-red-500 to-rose-600',
            bgColor: 'bg-status-critical/10',
            change: '-1',
            positive: true
        },
    ];

    const secondaryStats = [
        { title: 'Pending Labs', value: kpiData.pendingLabTests, icon: FlaskConical, color: 'text-status-warning' },
        { title: 'Pending Bills', value: kpiData.pendingBills, icon: Receipt, color: 'text-status-pending' },
        { title: "Today's Revenue", value: `₹${(kpiData.revenue.today / 1000).toFixed(0)}K`, icon: TrendingUp, color: 'text-status-success' },
        { title: 'Avg Wait Time', value: `${kpiData.averageWaitTime} min`, icon: Clock, color: 'text-muted-foreground' },
    ];

    const quickActions = [
        { title: 'New Patient', icon: Users, href: '/patients/register' },
        { title: 'View Beds', icon: Bed, href: '/beds' },
        { title: 'Lab Results', icon: FlaskConical, href: '/lab' },
        { title: 'Pharmacy', icon: Pill, href: '/pharmacy' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight">
                        Dashboard
                    </h1>
                    <p className="text-sm text-neutral-500 mt-1">
                        Welcome back. Here&apos;s what&apos;s happening today.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="pill-badge">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="pill-badge bg-status-success/10 text-status-success">
                        <HeartPulse className="w-4 h-4 mr-2" />
                        System Healthy
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <div
                        key={stat.title}
                        className="floating-card group cursor-pointer hover:shadow-lift transition-shadow"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105",
                                stat.color
                            )}>
                                <stat.icon className="w-6 h-6" />
                            </div>
                            <div className={cn(
                                "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                                stat.positive ? "bg-status-success/10 text-status-success" : "bg-status-critical/10 text-status-critical"
                            )}>
                                <ArrowUpRight className="w-3 h-3" />
                                {stat.change}
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                        <p className="text-3xl font-bold text-foreground font-serif">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {secondaryStats.map((stat) => (
                    <div key={stat.title} className="kpi-card flex items-center gap-4">
                        <div className={cn("w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center", stat.color)}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{stat.title}</p>
                            <p className="text-lg font-bold text-foreground">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Section */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Staff on Duty */}
                <div className="floating-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-primary" />
                            Staff on Duty
                        </h3>
                        <button className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                            View All <ChevronRight className="w-3 h-3" />
                        </button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Doctors', value: kpiData.staffOnDuty.doctors, color: 'bg-primary' },
                            { label: 'Nurses', value: kpiData.staffOnDuty.nurses, color: 'bg-status-success' },
                            { label: 'Support Staff', value: kpiData.staffOnDuty.support, color: 'bg-status-info' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-2 h-2 rounded-full", item.color)} />
                                    <span className="text-sm text-muted-foreground">{item.label}</span>
                                </div>
                                <span className="text-lg font-bold text-foreground">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Alerts */}
                <div className="floating-card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-serif text-lg font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-status-warning" />
                            Active Alerts
                        </h3>
                        <span className="status-badge bg-status-critical/10 text-status-critical">
                            {kpiData.criticalPatients + kpiData.lowStockItems} total
                        </span>
                    </div>
                    <div className="space-y-3">
                        <div className="p-3 bg-status-critical/5 rounded-xl border border-status-critical/20">
                            <div className="flex items-center gap-2 text-status-critical font-medium text-sm mb-1">
                                <div className="w-2 h-2 rounded-full bg-status-critical animate-pulse" />
                                Critical Patients
                            </div>
                            <p className="text-xs text-muted-foreground">{kpiData.criticalPatients} patients require immediate attention</p>
                        </div>
                        <div className="p-3 bg-status-warning/5 rounded-xl border border-status-warning/20">
                            <div className="flex items-center gap-2 text-status-warning font-medium text-sm mb-1">
                                <div className="w-2 h-2 rounded-full bg-status-warning" />
                                Low Stock Alert
                            </div>
                            <p className="text-xs text-muted-foreground">{kpiData.lowStockItems} items below threshold</p>
                        </div>
                        <div className="p-3 bg-status-info/5 rounded-xl border border-status-info/20">
                            <div className="flex items-center gap-2 text-status-info font-medium text-sm mb-1">
                                <div className="w-2 h-2 rounded-full bg-status-info" />
                                Pending Claims
                            </div>
                            <p className="text-xs text-muted-foreground">{kpiData.pendingInsuranceClaims} insurance claims awaiting</p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="floating-card">
                    <h3 className="font-serif text-lg font-semibold mb-6">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        {quickActions.map((action) => (
                            <button
                                key={action.title}
                                className="flex flex-col items-center justify-center p-4 rounded-xl bg-neutral-100/50 hover:bg-neutral-200 transition-colors group"
                            >
                                <action.icon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-2" />
                                <span className="text-xs font-medium text-foreground">{action.title}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
