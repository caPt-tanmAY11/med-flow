"use client";

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import JsBarcode from 'jsbarcode';
import {
    FlaskConical, Search, RefreshCw, AlertTriangle, Clock, CheckCircle,
    Loader2, FileText, Package, Users, Barcode as BarcodeIcon, X, Heart, AlertCircle,
    Download, ClipboardList, Plus, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Visual Barcode Component
const VisualBarcode = ({ value }: { value: string }) => {
    const barcodeRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (barcodeRef.current && value) {
            try {
                JsBarcode(barcodeRef.current, value, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 16,
                    margin: 10,
                    height: 60,
                    width: 1.5,
                    textAlign: "center"
                });
            } catch (e) {
                console.error("Barcode rendering error", e);
            }
        }
    }, [value]);

    return <svg ref={barcodeRef} className="max-w-full h-auto" />;
};

// Types
interface Patient {
    id: string;
    uhid: string;
    name: string;
    gender: string;
    dob: string;
    allergies: Array<{ allergen: string; severity: string; reaction: string | null }>;
    PatientImplant: Array<{ type: string; location: string; mriSafe: boolean | null }>;
}

interface LabTest {
    id: string;
    code: string;
    name: string;
    category: string;
    type: string;
    LabTestResultField: Array<{
        id: string;
        fieldName: string;
        fieldLabel: string;
        fieldType: string;
        unit: string | null;
        normalMin: number | null;
        normalMax: number | null;
        options: string[];
        isRequired: boolean;
    }>;
}

interface LabRequest {
    id: string;
    patientId: string;
    status: string;
    priority: string;
    barcode: string | null;
    hasAllergies: boolean;
    allergyNotes: string | null;
    hasImplants: boolean;
    implantDetails: string | null;
    isCritical: boolean;
    resultedAt: string | null;
    resultData: Record<string, string | number> | null;
    createdAt: string;
    LabTest: LabTest;
    Patient: Patient;
    safetyAlerts: {
        hasAllergies: boolean;
        allergies: Array<{ allergen: string; severity: string }>;
        hasImplants: boolean;
        implants: Array<{ type: string; location: string }>;
        isRadiology: boolean;
        requiresMRISafetyCheck: boolean;
    };
}

interface InventoryItem {
    id: string;
    itemCode: string;
    name: string;
    category: string;
    unit: string;
    currentStock: number;
    minStock: number;
    unitCost: number | null;
    expiryDate: string | null;
}

export default function LabTechnicianPage() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<'requests' | 'results' | 'inventory' | 'clients'>('requests');
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState<Record<string, number>>({});
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);
    const [showBarcodeModal, setShowBarcodeModal] = useState(false);
    const [showResultModal, setShowResultModal] = useState(false);
    const [generatedBarcode, setGeneratedBarcode] = useState('');
    const [resultData, setResultData] = useState<Record<string, string>>({});
    const [isCritical, setIsCritical] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch requests
    const fetchRequests = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/lab-technician/requests?status=${statusFilter}`);
            const result = await response.json();
            setRequests(result.data || []);
            setStats(result.stats?.byStatus || {});
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch inventory
    const fetchInventory = async () => {
        try {
            const response = await fetch('/api/lab-technician/inventory');
            const result = await response.json();
            setInventory(result.data || []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        }
    };

    useEffect(() => {
        fetchRequests();
        fetchInventory();
        const interval = setInterval(fetchRequests, 30000);
        return () => clearInterval(interval);
    }, [statusFilter]);

    // Generate barcode
    const handleGenerateBarcode = async () => {
        if (!selectedRequest) return;
        setSaving(true);
        try {
            const response = await fetch('/api/lab-technician/barcode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId: selectedRequest.id }),
            });
            const result = await response.json();
            if (response.ok) {
                setGeneratedBarcode(result.data.barcode);
                toast({ title: 'Success', description: 'Barcode generated' });
                fetchRequests();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to generate barcode', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Submit result
    const handleSubmitResult = async () => {
        if (!selectedRequest) return;

        // Validate required fields
        const missingFields = (selectedRequest.LabTest.LabTestResultField || [])
            .filter(f => f.isRequired && !resultData[f.fieldName])
            .map(f => f.fieldLabel);

        if (missingFields.length > 0) {
            toast({
                title: 'Missing Fields',
                description: `Please fill: ${missingFields.join(', ')}`,
                variant: 'destructive'
            });
            return;
        }

        setSaving(true);
        try {
            const response = await fetch('/api/lab-technician/results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: selectedRequest.id,
                    resultData,
                    isCritical,
                    resultedBy: 'Lab Technician',
                }),
            });
            const result = await response.json();
            if (response.ok) {
                toast({
                    title: 'Success',
                    description: result.message,
                    variant: result.analysis?.isCritical ? 'destructive' : 'default',
                });
                setShowResultModal(false);
                setSelectedRequest(null);
                setResultData({});
                setIsCritical(false);
                fetchRequests();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to submit result', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Status badge helper
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-blue-100 text-blue-700',
            sample_collected: 'bg-yellow-100 text-yellow-700',
            processing: 'bg-orange-100 text-orange-700',
            completed: 'bg-green-100 text-green-700',
        };
        return styles[status] || 'bg-gray-100 text-gray-500';
    };

    // Priority badge helper
    const getPriorityBadge = (priority: string) => {
        if (priority === 'STAT') return 'bg-red-500 text-white animate-pulse';
        if (priority === 'URGENT') return 'bg-amber-500 text-white';
        return 'bg-gray-100 text-gray-600';
    };

    // Check if value is abnormal
    const isAbnormal = (value: string, field: LabRequest['LabTest']['LabTestResultField'][0]) => {
        if (field.fieldType !== 'number' || field.normalMin === null || field.normalMax === null) return false;
        const numValue = parseFloat(value);
        return !isNaN(numValue) && (numValue < field.normalMin || numValue > field.normalMax);
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <FlaskConical className="w-6 h-6 text-primary" />
                        Lab Technician Dashboard
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage requests, enter results, track inventory
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchRequests}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-blue-600' },
                    { key: 'sample_collected', label: 'Collected', icon: BarcodeIcon, color: 'text-yellow-600' },
                    { key: 'processing', label: 'Processing', icon: FlaskConical, color: 'text-orange-600' },
                    { key: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
                ].map((stat) => (
                    <div
                        key={stat.key}
                        className={cn(
                            "kpi-card cursor-pointer transition-all",
                            statusFilter === stat.key && "ring-2 ring-primary"
                        )}
                        onClick={() => setStatusFilter(statusFilter === stat.key ? 'all' : stat.key)}
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={cn("w-4 h-4", stat.color)} />
                            <span className="text-xs text-muted-foreground">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{stats[stat.key] || 0}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg w-fit">
                {[
                    { id: 'requests', label: 'Requests', icon: ClipboardList },
                    { id: 'results', label: 'Results', icon: FileText },
                    { id: 'inventory', label: 'Inventory', icon: Package },
                    { id: 'clients', label: 'External Labs', icon: Users },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all",
                            activeTab === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Requests Tab */}
            {activeTab === 'requests' && (
                <div className="floating-card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No requests found
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Priority</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Test</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Patient</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Safety Alerts</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Barcode</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3">
                                            <span className={cn("px-2 py-1 text-xs rounded font-medium", getPriorityBadge(req.priority))}>
                                                {req.priority}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <p className="font-medium text-sm">{req.LabTest.name}</p>
                                            <p className="text-xs text-muted-foreground">{req.LabTest.code}</p>
                                        </td>
                                        <td className="p-3">
                                            <p className="text-sm">{req.Patient.name}</p>
                                            <p className="text-xs text-muted-foreground">{req.Patient.uhid}</p>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-1">
                                                {req.safetyAlerts.hasAllergies && (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                        <Heart className="w-3 h-3" />
                                                        Allergy
                                                    </span>
                                                )}
                                                {req.safetyAlerts.requiresMRISafetyCheck && (
                                                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                                                        <AlertTriangle className="w-3 h-3" />
                                                        MRI Check
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-3 font-mono text-sm">{req.barcode || '-'}</td>
                                        <td className="p-3">
                                            <span className={cn("px-2 py-1 text-xs rounded capitalize", getStatusBadge(req.status))}>
                                                {req.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                {!req.barcode && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setShowBarcodeModal(true);
                                                            setGeneratedBarcode('');
                                                        }}
                                                    >
                                                        <BarcodeIcon className="w-4 h-4 mr-1" />
                                                        Barcode
                                                    </Button>
                                                )}
                                                {(req.status === 'sample_collected' || req.status === 'processing') && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setShowResultModal(true);
                                                            setResultData({});
                                                            setIsCritical(false);
                                                        }}
                                                    >
                                                        Enter Result
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}

            {/* Results History Tab */}
            {activeTab === 'results' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium">Completed Results History</h2>
                        <Button variant="outline" size="sm" onClick={fetchRequests}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="floating-card overflow-hidden">
                            {requests.filter(r => r.status === 'completed').length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground">
                                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>No completed results yet</p>
                                    <p className="text-sm">Completed tests will appear here</p>
                                </div>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Test</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Patient</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Barcode</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Critical</th>
                                            <th className="text-left p-3 text-xs font-medium text-muted-foreground">Completed</th>
                                            <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {requests.filter(r => r.status === 'completed').map((req) => (
                                            <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3">
                                                    <p className="font-medium text-sm">{req.LabTest.name}</p>
                                                    <p className="text-xs text-muted-foreground">{req.LabTest.code}</p>
                                                </td>
                                                <td className="p-3">
                                                    <p className="text-sm">{req.Patient.name}</p>
                                                    <p className="text-xs text-muted-foreground">{req.Patient.uhid}</p>
                                                </td>
                                                <td className="p-3 font-mono text-sm">{req.barcode || '-'}</td>
                                                <td className="p-3">
                                                    {req.isCritical ? (
                                                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-100 text-red-700">
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Critical
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Normal</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">
                                                    {req.resultedAt ? new Date(req.resultedAt).toLocaleDateString() : '-'}
                                                </td>
                                                <td className="p-3 text-right">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedRequest(req);
                                                            setShowResultModal(true);
                                                        }}
                                                    >
                                                        <FileText className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Inventory Tab */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium">Lab Inventory</h2>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Item
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {inventory.map((item) => (
                            <div key={item.id} className={cn(
                                "floating-card p-4",
                                item.currentStock < item.minStock && "border-red-500 border-2"
                            )}>
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-medium">{item.name}</h3>
                                        <p className="text-xs text-muted-foreground">{item.itemCode}</p>
                                    </div>
                                    <span className="text-xs px-2 py-0.5 rounded bg-muted capitalize">{item.category}</span>
                                </div>

                                <div className="flex items-center justify-between mt-3">
                                    <div>
                                        <p className={cn(
                                            "text-2xl font-bold",
                                            item.currentStock < item.minStock ? "text-red-600" : "text-primary"
                                        )}>
                                            {item.currentStock}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.unit} (Min: {item.minStock})
                                        </p>
                                    </div>
                                    {item.currentStock < item.minStock && (
                                        <span className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Low Stock
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* External Clients Tab */}
            {activeTab === 'clients' && (
                <div className="floating-card p-8 text-center">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">External Lab Clients</h3>
                    <p className="text-muted-foreground mb-4">Manage partner labs that outsource diagnostics to your facility</p>
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Partner Lab
                    </Button>
                </div>
            )}

            {/* Barcode Modal */}
            {/* Barcode Modal */}
            {showBarcodeModal && selectedRequest && createPortal(
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200" onClick={() => { setShowBarcodeModal(false); setSelectedRequest(null); }}>
                    <div className="bg-background rounded-xl max-w-md w-full p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold">Generate Barcode</h2>
                            <Button variant="ghost" size="sm" onClick={() => { setShowBarcodeModal(false); setSelectedRequest(null); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Patient Safety Info */}
                        {(selectedRequest.safetyAlerts.hasAllergies || selectedRequest.safetyAlerts.hasImplants) && (
                            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                                <h3 className="font-medium text-amber-800 dark:text-amber-200 flex items-center gap-2 mb-2">
                                    <AlertCircle className="w-4 h-4" />
                                    Safety Alerts
                                </h3>
                                {selectedRequest.safetyAlerts.hasAllergies && (
                                    <p className="text-sm text-amber-700 dark:text-amber-300">
                                        🚨 Allergies: {selectedRequest.allergyNotes || selectedRequest.safetyAlerts.allergies.map(a => a.allergen).join(', ')}
                                    </p>
                                )}
                                {selectedRequest.safetyAlerts.hasImplants && (
                                    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                        ⚠️ Implants: {selectedRequest.implantDetails || 'Yes - check details'}
                                    </p>
                                )}
                            </div>
                        )}

                        <div className="space-y-3 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Test</span>
                                <span>{selectedRequest.LabTest.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Patient</span>
                                <span>{selectedRequest.Patient.name} ({selectedRequest.Patient.uhid})</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Sample Type</span>
                                <span>{selectedRequest.LabTest.category}</span>
                            </div>
                        </div>

                        {generatedBarcode ? (
                            <div className="space-y-4">
                                <div className="text-center p-6 bg-white border rounded-lg flex flex-col items-center justify-center">
                                    <VisualBarcode value={generatedBarcode} />
                                    <p className="text-sm text-muted-foreground mt-2">Barcode generated successfully</p>
                                </div>
                                <Button className="w-full" onClick={() => {
                                    const printWindow = window.open('', '_blank');
                                    if (printWindow) {
                                        printWindow.document.write(`
                                            <!DOCTYPE html>
                                            <html>
                                            <head>
                                                <title>Check Label - ${generatedBarcode}</title>
                                                <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
                                                <style>
                                                    body { font-family: sans-serif; text-align: center; padding: 10px; margin: 0; }
                                                    .label { border: 1px dashed #000; padding: 10px; display: inline-block; width: 300px; }
                                                    .meta { font-size: 12px; margin-top: 5px; text-align: left; }
                                                    @media print {
                                                        .no-print { display: none; }
                                                        .label { border: none; }
                                                    }
                                                </style>
                                            </head>
                                            <body onload="generate()">
                                                <div class="label">
                                                    <div class="meta" style="margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                                                        <strong>${selectedRequest.Patient.name}</strong><br>
                                                        ${selectedRequest.Patient.uhid} | ${selectedRequest.LabTest.code}
                                                    </div>
                                                    <svg id="barcode"></svg>
                                                    <div class="meta" style="margin-top: 5px; font-size: 10px;">
                                                        Sample: ${selectedRequest.LabTest.category} | ${new Date().toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <script>
                                                    function generate() {
                                                        JsBarcode("#barcode", "${generatedBarcode}", {
                                                            format: "CODE128",
                                                            displayValue: true,
                                                            fontSize: 14,
                                                            height: 40,
                                                            width: 1.5,
                                                            margin: 5
                                                        });
                                                        setTimeout(() => window.print(), 500);
                                                    }
                                                </script>
                                            </body>
                                            </html>
                                        `);
                                        printWindow.document.close();
                                    } else {
                                        toast({ title: 'Error', description: 'Pop-up blocked', variant: 'destructive' });
                                    }
                                }}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Print Label
                                </Button>
                            </div>
                        ) : (
                            <Button className="w-full" onClick={handleGenerateBarcode} disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Generate Barcode
                            </Button>
                        )}
                    </div>
                </div>,
                document.body
            )}

            {/* Result Entry Modal */}
            {showResultModal && selectedRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold">Enter Result</h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedRequest.LabTest.name} - {selectedRequest.Patient.name}
                                </p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => { setShowResultModal(false); setSelectedRequest(null); }}>
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Barcode Info */}
                        {selectedRequest.barcode && (
                            <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3">
                                <BarcodeIcon className="w-5 h-5 text-muted-foreground" />
                                <span className="font-mono">{selectedRequest.barcode}</span>
                            </div>
                        )}

                        {/* Result Fields */}
                        <div className="space-y-4 mb-6">
                            {(selectedRequest.LabTest.LabTestResultField?.length ?? 0) === 0 ? (
                                <div className="p-4 bg-muted rounded-lg text-center">
                                    <p className="text-muted-foreground">No result fields defined for this test.</p>
                                    <p className="text-sm">Please contact admin to configure result fields.</p>
                                </div>
                            ) : (
                                selectedRequest.LabTest.LabTestResultField?.map((field) => (
                                    <div key={field.id}>
                                        <Label className="flex items-center gap-2 mb-2">
                                            {field.fieldLabel}
                                            {field.isRequired && <span className="text-red-500">*</span>}
                                            {field.unit && <span className="text-muted-foreground">({field.unit})</span>}
                                        </Label>

                                        {field.fieldType === 'select' && field.options?.length > 0 ? (
                                            <select
                                                className="elegant-select w-full"
                                                value={resultData[field.fieldName] || ''}
                                                onChange={(e) => setResultData({ ...resultData, [field.fieldName]: e.target.value })}
                                            >
                                                <option value="">Select...</option>
                                                {field.options.map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div className="relative">
                                                <Input
                                                    type={field.fieldType === 'number' ? 'number' : 'text'}
                                                    placeholder={field.normalMin !== null && field.normalMax !== null
                                                        ? `Normal: ${field.normalMin} - ${field.normalMax}`
                                                        : `Enter ${field.fieldLabel.toLowerCase()}`
                                                    }
                                                    value={resultData[field.fieldName] || ''}
                                                    onChange={(e) => setResultData({ ...resultData, [field.fieldName]: e.target.value })}
                                                    className={cn(
                                                        isAbnormal(resultData[field.fieldName] || '', field) && "border-red-500 bg-red-50 dark:bg-red-950/20"
                                                    )}
                                                />
                                                {field.normalMin !== null && field.normalMax !== null && (
                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                                        {field.normalMin} - {field.normalMax}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {isAbnormal(resultData[field.fieldName] || '', field) && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Value is outside normal range
                                            </p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Critical Flag */}
                        <div className="flex items-center gap-3 mb-6 p-3 border rounded-lg">
                            <input
                                type="checkbox"
                                id="critical"
                                checked={isCritical}
                                onChange={(e) => setIsCritical(e.target.checked)}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="critical" className="cursor-pointer flex items-center gap-2 text-red-600">
                                <AlertTriangle className="w-4 h-4" />
                                Mark as Critical Value (requires immediate notification)
                            </Label>
                        </div>

                        <div className="flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => { setShowResultModal(false); setSelectedRequest(null); }}>
                                Cancel
                            </Button>
                            <Button className="flex-1" onClick={handleSubmitResult} disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                Submit Result
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
