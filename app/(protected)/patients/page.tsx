"use client";

import { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, Loader2, Eye, Edit, ChevronLeft, ChevronRight, X, AlertTriangle, Clock, FileText, Phone, MapPin, Shield, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

interface Allergy {
    id: string;
    allergen: string;
    allergenType: string;
    severity: string;
    reaction: string | null;
}

interface IdDocument {
    id: string;
    documentType: string;
    documentNumber: string | null;
    verified: boolean;
}

interface Patient {
    id: string;
    uhid: string;
    name: string;
    gender: string;
    dob: string;
    contact: string | null;
    email: string | null;
    bloodGroup: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    pincode: string | null;
    emergencyName: string | null;
    emergencyContact: string | null;
    emergencyRelation: string | null;
    isTemporary: boolean;
    tempExpiresAt: string | null;
    createdAt: string;
    allergies: Allergy[];
    idDocuments: IdDocument[];
    _count: { encounters: number };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function PatientsPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [search, setSearch] = useState('');
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [viewMode, setViewMode] = useState<'view' | 'edit' | null>(null);
    const [editForm, setEditForm] = useState<Partial<Patient>>({});
    const [saving, setSaving] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({ type: 'all', bloodGroup: '' });

    const fetchPatients = async (page = 1, query = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (query) params.append('query', query);
            const response = await fetch(`/api/patients?${params}`);
            const result = await response.json();
            let data = result.data || [];

            // Client-side filters
            if (filters.type === 'temporary') data = data.filter((p: Patient) => p.isTemporary);
            if (filters.type === 'permanent') data = data.filter((p: Patient) => !p.isTemporary);
            if (filters.bloodGroup) data = data.filter((p: Patient) => p.bloodGroup === filters.bloodGroup);

            setPatients(data);
            setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Failed to fetch patients:', error);
            toast({ title: 'Error', description: 'Failed to fetch patients', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPatients(); }, []);

    useEffect(() => {
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => fetchPatients(1, search), 300);
        setSearchTimeout(timeout);
        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, filters]);

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleView = (patient: Patient) => {
        setSelectedPatient(patient);
        setViewMode('view');
    };

    const handleEdit = (patient: Patient) => {
        setSelectedPatient(patient);
        setEditForm({ ...patient });
        setViewMode('edit');
    };

    const handleSave = async () => {
        if (!selectedPatient) return;
        setSaving(true);
        try {
            const response = await fetch(`/api/patients/${selectedPatient.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm),
            });
            if (response.ok) {
                toast({ title: 'Success', description: 'Patient updated successfully' });
                setViewMode(null);
                setSelectedPatient(null);
                fetchPatients(pagination.page, search);
            } else {
                const error = await response.json();
                toast({ title: 'Error', description: error.error || 'Failed to update', variant: 'destructive' });
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to update patient', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const closeModal = () => {
        setViewMode(null);
        setSelectedPatient(null);
        setEditForm({});
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'severe': return 'bg-red-100 text-red-700 border-red-200';
            case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'mild': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Patient Registry
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{pagination.total} registered patients</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                        <Filter className="w-4 h-4 mr-2" />Filters
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => fetchPatients(pagination.page, search)}>
                        <RefreshCw className="w-4 h-4 mr-2" />Refresh
                    </Button>
                    <Link href="/registration"><Button size="sm">Register New Patient</Button></Link>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="space-y-3">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search by name, UHID, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>

                {showFilters && (
                    <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                        <div>
                            <Label className="text-xs text-muted-foreground">Registration Type</Label>
                            <select className="elegant-select mt-1" value={filters.type} onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}>
                                <option value="all">All</option>
                                <option value="permanent">Permanent</option>
                                <option value="temporary">Temporary/Emergency</option>
                            </select>
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground">Blood Group</Label>
                            <select className="elegant-select mt-1" value={filters.bloodGroup} onChange={(e) => setFilters(f => ({ ...f, bloodGroup: e.target.value }))}>
                                <option value="">All</option>
                                <option value="A+">A+</option><option value="A-">A-</option>
                                <option value="B+">B+</option><option value="B-">B-</option>
                                <option value="O+">O+</option><option value="O-">O-</option>
                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                            </select>
                        </div>
                        <Button variant="ghost" size="sm" className="self-end" onClick={() => setFilters({ type: 'all', bloodGroup: '' })}>Clear</Button>
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="floating-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : patients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No patients found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">UHID</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Age/Gender</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Phone</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">City</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Blood</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Status</th>
                                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">Registered</th>
                                    <th className="text-right p-3 text-xs font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {patients.map((patient) => (
                                    <tr key={patient.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="p-3 font-mono text-sm">{patient.uhid}</td>
                                        <td className="p-3 font-medium">{patient.name}</td>
                                        <td className="p-3 text-sm text-muted-foreground">{getAge(patient.dob)}y / {patient.gender.charAt(0)}</td>
                                        <td className="p-3 text-sm">{patient.contact || '-'}</td>
                                        <td className="p-3 text-sm">{patient.city || '-'}</td>
                                        <td className="p-3">
                                            {patient.bloodGroup ? (
                                                <span className="px-2 py-0.5 text-xs bg-status-critical/10 text-status-critical rounded font-medium">{patient.bloodGroup}</span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-3">
                                            {patient.isTemporary ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                                                    <Clock className="w-3 h-3" />Temp
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Permanent</span>
                                            )}
                                        </td>
                                        <td className="p-3 text-sm text-muted-foreground">{formatDate(patient.createdAt)}</td>
                                        <td className="p-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="sm" onClick={() => handleView(patient)} title="View Details">
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" onClick={() => handleEdit(patient)} title="Edit Patient">
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={pagination.page === 1} onClick={() => fetchPatients(pagination.page - 1, search)}><ChevronLeft className="w-4 h-4" /></Button>
                        <span className="px-3 py-1 text-sm">Page {pagination.page} of {pagination.totalPages}</span>
                        <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages} onClick={() => fetchPatients(pagination.page + 1, search)}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                </div>
            )}

            {/* Detail/Edit Modal */}
            {viewMode && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background">
                            <div>
                                <h2 className="text-lg font-semibold">{viewMode === 'view' ? 'Patient Details' : 'Edit Patient'}</h2>
                                <p className="text-sm text-muted-foreground font-mono">{selectedPatient.uhid}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={closeModal}><X className="w-4 h-4" /></Button>
                        </div>

                        <div className="p-6">
                            {viewMode === 'view' ? (
                                <div className="space-y-6">
                                    {/* Status Badges */}
                                    <div className="flex gap-2 flex-wrap">
                                        {selectedPatient.isTemporary && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-full">
                                                <Clock className="w-4 h-4" />Temporary Registration
                                                {selectedPatient.tempExpiresAt && ` (Expires: ${formatDate(selectedPatient.tempExpiresAt)})`}
                                            </span>
                                        )}
                                        {selectedPatient.allergies.length > 0 && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded-full">
                                                <AlertTriangle className="w-4 h-4" />{selectedPatient.allergies.length} Allergy Alert{selectedPatient.allergies.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Personal Information */}
                                    <div className="floating-card p-4">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <Users className="w-4 h-4 text-primary" />Personal Information
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div><Label className="text-muted-foreground text-xs">Full Name</Label><p className="font-medium">{selectedPatient.name}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Date of Birth</Label><p>{formatDate(selectedPatient.dob)} ({getAge(selectedPatient.dob)} years)</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Gender</Label><p>{selectedPatient.gender}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Blood Group</Label><p className="font-medium text-red-600">{selectedPatient.bloodGroup || '-'}</p></div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="floating-card p-4">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-primary" />Contact Information
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            <div><Label className="text-muted-foreground text-xs">Phone</Label><p>{selectedPatient.contact || '-'}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Email</Label><p>{selectedPatient.email || '-'}</p></div>
                                            <div className="md:col-span-1"></div>
                                            <div><Label className="text-muted-foreground text-xs">Emergency Contact Name</Label><p>{selectedPatient.emergencyName || '-'}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Emergency Phone</Label><p>{selectedPatient.emergencyContact || '-'}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Relation</Label><p>{selectedPatient.emergencyRelation || '-'}</p></div>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="floating-card p-4">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-primary" />Address
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Street Address</Label><p>{selectedPatient.address || '-'}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">City</Label><p>{selectedPatient.city || '-'}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">State</Label><p>{selectedPatient.state || '-'}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">PIN Code</Label><p>{selectedPatient.pincode || '-'}</p></div>
                                        </div>
                                    </div>

                                    {/* ID Documents */}
                                    <div className="floating-card p-4">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-primary" />ID Documents
                                        </h3>
                                        {selectedPatient.idDocuments.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">No ID documents on file</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedPatient.idDocuments.map((doc) => (
                                                    <div key={doc.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                        <div>
                                                            <p className="font-medium capitalize">{doc.documentType}</p>
                                                            <p className="text-sm text-muted-foreground font-mono">{doc.documentNumber || 'Number not recorded'}</p>
                                                        </div>
                                                        <span className={`px-2 py-1 text-xs rounded ${doc.verified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {doc.verified ? '✓ Verified' : 'Pending'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Allergies */}
                                    <div className="floating-card p-4">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-primary" />Known Allergies
                                        </h3>
                                        {selectedPatient.allergies.length === 0 ? (
                                            <p className="text-muted-foreground text-sm">No known allergies</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {selectedPatient.allergies.map((allergy) => (
                                                    <div key={allergy.id} className={`p-3 rounded-lg border ${getSeverityColor(allergy.severity)}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="font-medium">{allergy.allergen}</p>
                                                                <p className="text-sm opacity-80">Type: {allergy.allergenType} | Severity: {allergy.severity}</p>
                                                            </div>
                                                        </div>
                                                        {allergy.reaction && <p className="text-sm mt-1 opacity-80">Reaction: {allergy.reaction}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Registration Info */}
                                    <div className="floating-card p-4">
                                        <h3 className="font-semibold mb-4 text-muted-foreground text-sm">Registration Details</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div><Label className="text-muted-foreground text-xs">Registered On</Label><p>{formatDate(selectedPatient.createdAt)}</p></div>
                                            <div><Label className="text-muted-foreground text-xs">Registration Type</Label><p>{selectedPatient.isTemporary ? 'Temporary/Emergency' : 'Permanent'}</p></div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Edit Form */
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><Label>Name</Label><Input value={editForm.name || ''} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
                                        <div><Label>Contact</Label><Input value={editForm.contact || ''} onChange={(e) => setEditForm(f => ({ ...f, contact: e.target.value }))} /></div>
                                        <div><Label>Email</Label><Input type="email" value={editForm.email || ''} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
                                        <div><Label>Blood Group</Label>
                                            <select className="elegant-select" value={editForm.bloodGroup || ''} onChange={(e) => setEditForm(f => ({ ...f, bloodGroup: e.target.value }))}>
                                                <option value="">Select</option>
                                                <option value="A+">A+</option><option value="A-">A-</option>
                                                <option value="B+">B+</option><option value="B-">B-</option>
                                                <option value="O+">O+</option><option value="O-">O-</option>
                                                <option value="AB+">AB+</option><option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                        <div className="col-span-2"><Label>Address</Label><Input value={editForm.address || ''} onChange={(e) => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
                                        <div><Label>City</Label><Input value={editForm.city || ''} onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))} /></div>
                                        <div><Label>State</Label><Input value={editForm.state || ''} onChange={(e) => setEditForm(f => ({ ...f, state: e.target.value }))} /></div>
                                        <div><Label>PIN Code</Label><Input value={editForm.pincode || ''} onChange={(e) => setEditForm(f => ({ ...f, pincode: e.target.value }))} /></div>
                                        <div></div>
                                        <div><Label>Emergency Contact Name</Label><Input value={editForm.emergencyName || ''} onChange={(e) => setEditForm(f => ({ ...f, emergencyName: e.target.value }))} /></div>
                                        <div><Label>Emergency Contact Phone</Label><Input value={editForm.emergencyContact || ''} onChange={(e) => setEditForm(f => ({ ...f, emergencyContact: e.target.value }))} /></div>
                                        <div><Label>Emergency Contact Relation</Label><Input value={editForm.emergencyRelation || ''} onChange={(e) => setEditForm(f => ({ ...f, emergencyRelation: e.target.value }))} /></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2 p-4 border-t sticky bottom-0 bg-background">
                            <Button variant="outline" onClick={closeModal}>Cancel</Button>
                            {viewMode === 'view' ? (
                                <Button onClick={() => { setEditForm({ ...selectedPatient }); setViewMode('edit'); }}>Edit</Button>
                            ) : (
                                <Button onClick={handleSave} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Changes
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
