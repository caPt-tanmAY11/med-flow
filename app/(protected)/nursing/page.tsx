"use client";

import { Heart, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { mockNursingTasks } from '@/data/mockData';
import { cn } from '@/lib/utils';

export default function NursingPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                    <Heart className="w-6 h-6 text-primary" />
                    Nursing Station
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage nursing tasks, medications, and patient care
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-critical/10 flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-status-critical" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">High Priority</p>
                        <p className="text-lg font-bold">3</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-warning/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-status-warning" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-lg font-bold">8</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-info/10 flex items-center justify-center">
                        <Heart className="w-5 h-5 text-status-info" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">In Progress</p>
                        <p className="text-lg font-bold">2</p>
                    </div>
                </div>
                <div className="kpi-card flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-status-success/10 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-status-success" />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="text-lg font-bold">24</p>
                    </div>
                </div>
            </div>

            <div className="floating-card">
                <h3 className="font-semibold mb-4">Nursing Tasks</h3>
                <div className="space-y-3">
                    {mockNursingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    task.priority === 'high' && "bg-status-critical",
                                    task.priority === 'medium' && "bg-status-warning",
                                    task.priority === 'low' && "bg-status-success"
                                )} />
                                <div>
                                    <p className="font-medium">{task.task}</p>
                                    <p className="text-xs text-muted-foreground">{task.patientName} • Bed {task.bedNumber}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={cn(
                                    "status-badge text-xs",
                                    task.status === 'pending' && "bg-status-warning/10 text-status-warning",
                                    task.status === 'in-progress' && "bg-status-info/10 text-status-info",
                                    task.status === 'completed' && "bg-status-success/10 text-status-success",
                                    task.status === 'overdue' && "bg-status-critical/10 text-status-critical"
                                )}>
                                    {task.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
