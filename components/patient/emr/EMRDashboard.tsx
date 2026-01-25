"use client";

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Activity,
    Heart,
    Thermometer,
    Wind,
    Stethoscope,
    Pill,
    FileText,
    History,
    Cigarette,
    Wine,
    Briefcase,
    Utensils,
    Moon
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import {
    patientVitals,
    medicalClassification,
    currentMedications,
    patientHistory,
    nursingNotes,
    vitalHistoryData
} from './dummy-data';

export default function EMRDashboard() {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">EMR Record</h2>
                    <p className="text-muted-foreground">
                        Electronic Medical Record & Analytics
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="px-4 py-1.5 text-sm bg-background">
                        UHID: P-2024-001
                    </Badge>
                     <Badge className="px-4 py-1.5 text-sm bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">
                        Status: Active
                    </Badge>
                </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <MetricCard
                    title="Heart Rate"
                    value={`${patientVitals.heartRate} bpm`}
                    status="Normal"
                    icon={Heart}
                    color="text-red-500"
                    trend="+2% vs last hr"
                />
                <MetricCard
                    title="BP"
                    value={`${patientVitals.bloodPressure.systolic}/${patientVitals.bloodPressure.diastolic}`}
                    status="Elevated"
                    icon={Activity}
                    color="text-blue-500"
                    trend="-5% vs last hr"
                />
                <MetricCard
                    title="SpO2"
                    value={`${patientVitals.spo2}%`}
                    status="Normal"
                    icon={Wind}
                    color="text-sky-500"
                    trend="Stable"
                />
                <MetricCard
                    title="Temperature"
                    value={`${patientVitals.temperature}°F`}
                    status="Normal"
                    icon={Thermometer}
                    color="text-orange-500"
                    trend="Stable"
                />
                <MetricCard
                    title="Resp. Rate"
                    value={`${patientVitals.respiratoryRate}/min`}
                    status="Normal"
                    icon={Wind}
                    color="text-teal-500"
                    trend="Stable"
                />
            </div>

            {/* Main Content Areas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Charts & History */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-none shadow-md bg-white/50 backdrop-blur-sm">
                         <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Vitals History
                            </CardTitle>
                            <CardDescription>
                                24-hour monitoring trends
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={vitalHistoryData}>
                                        <defs>
                                            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorSpo2" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis 
                                            dataKey="time" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                                            dy={10}
                                        />
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: '#6B7280', fontSize: 12 }} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="heartRate" 
                                            stroke="#ef4444" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorHr)" 
                                            name="Heart Rate"
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="spo2" 
                                            stroke="#0ea5e9" 
                                            strokeWidth={3} 
                                            fillOpacity={1} 
                                            fill="url(#colorSpo2)" 
                                            name="SpO2"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="medical" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1">
                            <TabsTrigger value="medical">Medical History</TabsTrigger>
                            <TabsTrigger value="lifestyle">Lifestyle & Social</TabsTrigger>
                            <TabsTrigger value="medications">Medications</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="medical" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Medical & Surgical History</CardTitle>
                                    <CardDescription>Documented procedures and family history</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <History className="w-4 h-4 text-primary" />
                                            Surgeries
                                        </h4>
                                        <div className="space-y-3">
                                            {patientHistory.surgeries.map((surgery, i) => (
                                                <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-secondary/30">
                                                    <div>
                                                        <p className="font-medium text-sm">{surgery.procedure}</p>
                                                        <p className="text-xs text-muted-foreground">{surgery.hospital}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">{surgery.date}</p>
                                                        <Badge variant="outline" className="text-[10px]">{surgery.outcome}</Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                            <UsersIcon className="w-4 h-4 text-primary" />
                                            Family History
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            {patientHistory.parental.map((parent, i) => (
                                                <div key={i} className="p-3 border rounded-lg">
                                                    <p className="text-sm font-medium">{parent.relation}</p>
                                                    <p className="text-sm text-red-500/80">{parent.condition}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="lifestyle" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Lifestyle & Social History</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-full dark:bg-slate-800">
                                                    <Cigarette className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Smoking</p>
                                                    <p className="text-sm text-muted-foreground">{patientHistory.smoking.status}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-pink-100 rounded-full dark:bg-pink-900/20">
                                                    <Wine className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Alcohol</p>
                                                    <p className="text-sm text-muted-foreground">{patientHistory.alcohol.status}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 rounded-full dark:bg-blue-900/20">
                                                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Employment</p>
                                                    <p className="text-sm text-muted-foreground">{patientHistory.employment}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                                            <h4 className="text-sm font-semibold">Daily Habits</h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Activity className="w-3 h-3" /> Exercise
                                                    </span>
                                                    <span>{patientHistory.lifestyle.exercise}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Utensils className="w-3 h-3" /> Diet
                                                    </span>
                                                    <span>{patientHistory.lifestyle.diet}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="flex items-center gap-2 text-muted-foreground">
                                                        <Moon className="w-3 h-3" /> Sleep
                                                    </span>
                                                    <span>{patientHistory.lifestyle.sleep}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="medications" className="mt-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Current Medications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {currentMedications.map((med, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                                                        <Pill className="w-5 h-5 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{med.name}</p>
                                                        <p className="text-xs text-muted-foreground">{med.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant="secondary" className="mb-1">{med.dosage}</Badge>
                                                    <p className="text-xs text-muted-foreground">{med.frequency}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Summary & Notes */}
                <div className="space-y-6">
                    {/* Medical Classification */}
                    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-100 dark:border-indigo-900">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Stethoscope className="w-5 h-5 text-indigo-600" />
                                Medical Classification
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Triage Level</p>
                                    <p className="font-semibold text-indigo-700 dark:text-indigo-400">{medicalClassification.triageLevel}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Severity</p>
                                    <p className="font-semibold text-indigo-700 dark:text-indigo-400">{medicalClassification.severity}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Condition</p>
                                    <p className="font-semibold text-green-700 dark:text-green-400">{medicalClassification.condition}</p>
                                </div>
                                <div className="bg-white/60 dark:bg-black/20 p-3 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Type</p>
                                    <p className="font-semibold text-indigo-700 dark:text-indigo-400">{medicalClassification.admissionType}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Nursing Notes */}
                    <Card className="h-[500px] flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-primary" />
                                    Clinical Information
                                </span>
                            </CardTitle>
                             <CardDescription>Nursing & Clinical Notes</CardDescription>
                        </CardHeader>
                         <CardContent className="flex-1 p-0">
                            <ScrollArea className="h-[400px] px-6">
                                <div className="space-y-8 pr-4">
                                    {nursingNotes.map((note, i) => (
                                        <div key={i} className="relative pl-6 pb-6 border-l last:pb-0">
                                            <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary" />
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-semibold text-primary">{new Date(note.date).toLocaleDateString()}</span>
                                                <span className="text-[10px] text-muted-foreground">{new Date(note.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-sm text-foreground/90 mb-2">{note.note}</p>
                                            <p className="text-xs text-muted-foreground italic">- {note.author}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, status, icon: Icon, color, trend }: any) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-all duration-300">
            <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-muted-foreground">{title}</p>
                    <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex items-end justify-between">
                    <div>
                        <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
                        <p className={`text-[10px] mt-1 ${trend.includes('+') ? 'text-green-600' : trend.includes('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {trend}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function UsersIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
