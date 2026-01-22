"use client";

import { useEffect, useState } from 'react';
import { Users, Search, RefreshCw, Loader2, Eye, Edit, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

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
    emergencyName: string | null;
    emergencyContact: string | null;
    allergies: { allergen: string; severity: string }[];
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

    const fetchPatients = async (page = 1, query = '') => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '20' });
            if (query) params.append('query', query);
            const response = await fetch(`/api/patients?${params}`);
            const result = await response.json();
            setPatients(result.data || []);
            setPagination(result.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Failed to fetch patients:', error);
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
    }, [search]);

    const getAge = (dob: string) => {
        const today = new Date();
        const birth = new Date(dob);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
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
        } catch (error) {
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-primary" />
                        Patients
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">{pagination.total} registered patients</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => fetchPatients(pagination.page, search)}>
                        <RefreshCw className="w-4 h-4 mr-2" />Refresh
                    </Button>
                    <Link href="/registration"><Button size="sm">Register New Patient</Button></Link>
                </div>
            </div>

            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search by name, UHID, or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="floating-card overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : patients.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No patients found</p>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted/50">
                            <tr>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">UHID</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Age/Gender</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Contact</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Blood Group</th>
                                <th className="text-left p-3 text-xs font-medium text-muted-foreground">Visits</th>
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
                                    <td className="p-3">{patient.bloodGroup ? <span className="px-2 py-0.5 text-xs bg-status-critical/10 text-status-critical rounded">{patient.bloodGroup}</span> : '-'}</td>
                                    <td className="p-3 text-sm">{patient._count.encounters}</td>
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
                )}
            </div>

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

            {/* View/Edit Modal */}
            {viewMode && selectedPatient && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold">{viewMode === 'view' ? 'Patient Details' : 'Edit Patient'}</h2>
                            <Button variant="ghost" size="sm" onClick={closeModal}><X className="w-4 h-4" /></Button>
                        </div>
                        <div className="p-4 space-y-4">
                            {viewMode === 'view' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><Label className="text-muted-foreground text-xs">UHID</Label><p className="font-mono">{selectedPatient.uhid}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Name</Label><p className="font-medium">{selectedPatient.name}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Date of Birth</Label><p>{new Date(selectedPatient.dob).toLocaleDateString()}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Gender</Label><p>{selectedPatient.gender}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Contact</Label><p>{selectedPatient.contact || '-'}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Email</Label><p>{selectedPatient.email || '-'}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Blood Group</Label><p>{selectedPatient.bloodGroup || '-'}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Total Visits</Label><p>{selectedPatient._count.encounters}</p></div>
                                    <div className="col-span-2"><Label className="text-muted-foreground text-xs">Address</Label><p>{selectedPatient.address || '-'}{selectedPatient.city ? `, ${selectedPatient.city}` : ''}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Emergency Contact</Label><p>{selectedPatient.emergencyName || '-'}</p></div>
                                    <div><Label className="text-muted-foreground text-xs">Emergency Phone</Label><p>{selectedPatient.emergencyContact || '-'}</p></div>
                                </div>
                            ) : (
                                <div className="space-y-4">
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
                                        <div><Label>Emergency Contact Name</Label><Input value={editForm.emergencyName || ''} onChange={(e) => setEditForm(f => ({ ...f, emergencyName: e.target.value }))} /></div>
                                        <div><Label>Emergency Contact Phone</Label><Input value={editForm.emergencyContact || ''} onChange={(e) => setEditForm(f => ({ ...f, emergencyContact: e.target.value }))} /></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 p-4 border-t">
                            <Button variant="outline" onClick={closeModal}>Cancel</Button>
                            {viewMode === 'view' ? (
                                <Button onClick={() => { setEditForm({ ...selectedPatient }); setViewMode('edit'); }}>Edit</Button>
                            ) : (
                                <Button onClick={handleSave} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Save Changes</Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
