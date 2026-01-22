"use client";

import { useEffect, useState } from 'react';
import { Shield, AlertTriangle, AlertCircle, Info, RefreshCw, Loader2, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface SafetyAlert {
    id: string;
    alertType: string;
    severity: string;
    message: string;
    triggeredAt: string;
    acknowledgedBy: string | null;
    acknowledgedAt: string | null;
    overrideReason: string | null;
    patientId: string;
    encounter?: { patient: { uhid: string; name: string } } | null;
}

interface Incident {
    id: string;
    incidentType: string;
    severity: string;
    location: string;
    description: string;
    reportedBy: string;
    reportedAt: string;
    status: string;
    patientId: string | null;
}

export default function SafetyPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [activeTab, setActiveTab] = useState<'alerts' | 'incidents'>('alerts');
    const [showAckModal, setShowAckModal] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<SafetyAlert | null>(null);
    const [overrideReason, setOverrideReason] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchAlerts = async () => {
        try {
            const response = await fetch('/api/alerts?acknowledged=false');
            const result = await response.json();
            setAlerts(result.data || []);
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        }
    };

    const fetchIncidents = async () => {
        try {
            const response = await fetch('/api/incidents');
            const result = await response.json();
            setIncidents(result.data || []);
        } catch (error) {
            console.error('Failed to fetch incidents:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchAlerts(), fetchIncidents()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAcknowledge = async (acknowledge: boolean) => {
        if (!selectedAlert) return;
        if (acknowledge && !overrideReason.trim()) {
            toast({ title: 'Error', description: 'Please provide a reason', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            const response = await fetch(`/api/alerts/${selectedAlert.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ acknowledgedBy: 'Current User', overrideReason: acknowledge ? overrideReason : null }),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Alert acknowledged' });
                setShowAckModal(false);
                setSelectedAlert(null);
                setOverrideReason('');
                fetchAlerts();
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const openAcknowledge = (alert: SafetyAlert) => {
        setSelectedAlert(alert);
        setShowAckModal(true);
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'critical': return <AlertTriangle className="w-5 h-5 text-status-critical" />;
            case 'warning': return <AlertCircle className="w-5 h-5 text-status-warning" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'critical': return 'bg-status-critical/10 text-status-critical border-status-critical';
            case 'high': return 'bg-status-critical/10 text-status-critical border-status-critical';
            case 'warning': return 'bg-status-warning/10 text-status-warning border-status-warning';
            case 'medium': return 'bg-status-warning/10 text-status-warning border-status-warning';
            default: return 'bg-blue-100 text-blue-700 border-blue-300';
        }
    };

    const getAlertTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'allergy': 'Allergy Alert',
            'drug-interaction': 'Drug Interaction',
            'critical-lab': 'Critical Lab Value',
            'vital-abnormality': 'Vital Abnormality',
            'duplicate-order': 'Duplicate Order',
        };
        return labels[type] || type;
    };

    const stats = {
        critical: alerts.filter(a => a.severity === 'critical').length,
        warning: alerts.filter(a => a.severity === 'warning').length,
        info: alerts.filter(a => a.severity === 'info').length,
        openIncidents: incidents.filter(i => i.status !== 'closed').length,
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2"><Shield className="w-6 h-6 text-primary" />Safety Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-1">Monitor alerts and incidents in real-time</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                <div className="kpi-card border-l-4 border-l-status-critical"><p className="text-xs text-muted-foreground">Critical Alerts</p><p className="text-2xl font-bold text-status-critical">{stats.critical}</p></div>
                <div className="kpi-card border-l-4 border-l-status-warning"><p className="text-xs text-muted-foreground">Warnings</p><p className="text-2xl font-bold text-status-warning">{stats.warning}</p></div>
                <div className="kpi-card border-l-4 border-l-blue-500"><p className="text-xs text-muted-foreground">Info</p><p className="text-2xl font-bold text-blue-500">{stats.info}</p></div>
                <div className="kpi-card border-l-4 border-l-orange-500"><p className="text-xs text-muted-foreground">Open Incidents</p><p className="text-2xl font-bold text-orange-500">{stats.openIncidents}</p></div>
            </div>

            <div className="flex gap-2">
                <Button variant={activeTab === 'alerts' ? 'default' : 'outline'} onClick={() => setActiveTab('alerts')}>Safety Alerts ({alerts.length})</Button>
                <Button variant={activeTab === 'incidents' ? 'default' : 'outline'} onClick={() => setActiveTab('incidents')}>Incidents ({incidents.length})</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : activeTab === 'alerts' ? (
                <div className="space-y-3">
                    {alerts.length === 0 ? (
                        <div className="floating-card text-center py-12"><CheckCircle className="w-12 h-12 mx-auto text-status-success mb-4" /><p className="text-muted-foreground">No active alerts</p></div>
                    ) : (
                        alerts.sort((a, b) => { const order = { critical: 0, warning: 1, info: 2 }; return (order[a.severity as keyof typeof order] ?? 3) - (order[b.severity as keyof typeof order] ?? 3); }).map((alert) => (
                            <div key={alert.id} className={cn("floating-card border-l-4", alert.severity === 'critical' ? 'border-l-status-critical bg-status-critical/5' : alert.severity === 'warning' ? 'border-l-status-warning bg-status-warning/5' : 'border-l-blue-500')}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {getSeverityIcon(alert.severity)}
                                        <div>
                                            <div className="flex items-center gap-2"><p className="font-medium">{alert.message}</p><span className={cn("px-2 py-0.5 text-xs rounded border", getSeverityBadge(alert.severity))}>{alert.severity}</span></div>
                                            <p className="text-sm text-muted-foreground">{getAlertTypeLabel(alert.alertType)} • {alert.encounter?.patient?.name || 'Unknown Patient'}</p>
                                            <p className="text-xs text-muted-foreground mt-1">{new Date(alert.triggeredAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => openAcknowledge(alert)}>Acknowledge</Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {incidents.length === 0 ? (
                        <div className="floating-card text-center py-12"><p className="text-muted-foreground">No incidents reported</p></div>
                    ) : (
                        incidents.map((incident) => (
                            <div key={incident.id} className={cn("floating-card border-l-4", incident.severity === 'critical' || incident.severity === 'high' ? 'border-l-status-critical' : incident.severity === 'medium' ? 'border-l-status-warning' : 'border-l-blue-500')}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2"><p className="font-medium capitalize">{incident.incidentType.replace('-', ' ')}</p><span className={cn("px-2 py-0.5 text-xs rounded border capitalize", getSeverityBadge(incident.severity))}>{incident.severity}</span><span className={cn("px-2 py-0.5 text-xs rounded capitalize", incident.status === 'closed' ? 'bg-status-success/10 text-status-success' : incident.status === 'resolved' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600')}>{incident.status}</span></div>
                                        <p className="text-sm text-muted-foreground mt-1">{incident.description}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Location: {incident.location} • Reported by: {incident.reportedBy} • {new Date(incident.reportedAt).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Acknowledge Modal */}
            {showAckModal && selectedAlert && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Acknowledge Alert</h2><Button variant="ghost" size="sm" onClick={() => { setShowAckModal(false); setSelectedAlert(null); }}><X className="w-4 h-4" /></Button></div>
                        <div className={cn("p-3 rounded-lg mb-4", selectedAlert.severity === 'critical' ? 'bg-status-critical/10' : 'bg-status-warning/10')}>
                            <p className="font-medium">{selectedAlert.message}</p>
                            <p className="text-sm text-muted-foreground mt-1">{getAlertTypeLabel(selectedAlert.alertType)}</p>
                        </div>
                        <div className="mb-4"><label className="text-sm font-medium">Override Reason *</label><textarea className="w-full p-3 border rounded-lg min-h-[80px] resize-none mt-1" placeholder="Document why you are acknowledging this alert..." value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} /></div>
                        <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => { setShowAckModal(false); setSelectedAlert(null); }}>Cancel</Button><Button onClick={() => handleAcknowledge(true)} disabled={saving || !overrideReason.trim()}>{saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Acknowledge & Override</Button></div>
                    </div>
                </div>
            )}
        </div>
    );
}
