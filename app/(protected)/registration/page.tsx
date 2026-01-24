"use client";

import { useState, useEffect } from 'react';
import { UserPlus, Users, FileText, Phone, MapPin, AlertCircle, Loader2, CheckCircle, AlertTriangle, QrCode, Stethoscope, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';
import { AadhaarQRData, getAadhaarLast4 } from '@/lib/aadhaar-qr';

interface Doctor {
    id: string;
    name: string;
    email: string;
}

interface FormData {
    firstName: string;
    lastName: string;
    dob: string;
    gender: string;
    bloodGroup: string;
    phone: string;
    email: string;
    emergency: string;
    emergencyName: string;
    emergencyRelation: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    idType: string;
    idNumber: string;
    allergies: string;
    conditions: string;
    isTemporary: boolean;
    // Visit Details
    visitType: string;
    department: string;
    priority: string;
    referredDoctor?: string;
    ward?: string;
}

export default function RegistrationPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [duplicates, setDuplicates] = useState<{ id: string; uhid: string; name: string; similarity: string }[]>([]);
    const [registeredPatient, setRegisteredPatient] = useState<{ uhid: string; name: string } | null>(null);
    const [showIdCapture, setShowIdCapture] = useState(false);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);

    // Fetch doctors on component mount
    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const response = await fetch('/api/doctors');
                const result = await response.json();
                setDoctors(result.data || []);
            } catch (error) {
                console.error('Failed to fetch doctors:', error);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    const [formData, setFormData] = useState<FormData>({
        firstName: '',
        lastName: '',
        dob: '',
        gender: '',
        bloodGroup: '',
        phone: '',
        email: '',
        emergency: '',
        emergencyName: '',
        emergencyRelation: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        idType: '',
        idNumber: '',
        allergies: '',
        conditions: '',
        isTemporary: false,
        visitType: 'OPD',
        department: 'General Medicine',
        priority: 'GREEN',
        referredDoctor: '',
        ward: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setDuplicates([]);
        setRegisteredPatient(null);

        try {
            const allergiesArray = formData.allergies
                ? formData.allergies.split(',').map(a => ({
                    allergen: a.trim(),
                    allergenType: 'drug' as const,
                    severity: 'moderate' as const,
                }))
                : [];

            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${formData.firstName} ${formData.lastName}`.trim(),
                    dob: formData.dob,
                    gender: formData.gender.toUpperCase(),
                    contact: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    pincode: formData.pincode,
                    bloodGroup: formData.bloodGroup,
                    emergencyName: formData.emergencyName,
                    emergencyContact: formData.emergency,
                    emergencyRelation: formData.emergencyRelation,
                    isTemporary: formData.isTemporary,
                    idType: formData.idType || undefined,
                    idNumber: formData.idNumber || undefined,
                    allergies: allergiesArray.length > 0 ? allergiesArray : undefined,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Registration failed');
            }

            if (result.duplicates && result.duplicates.length > 0) {
                setDuplicates(result.duplicates);
            }

            setRegisteredPatient({
                uhid: result.data.uhid,
                name: result.data.name,
            });

            // Create Encounter
            const encounterResponse = await fetch('/api/encounters', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    patientId: result.data.id,
                    type: formData.visitType,
                    department: formData.department,
                    primaryDoctorId: formData.visitType === 'OPD' ? formData.referredDoctor : undefined,
                    triageColor: formData.visitType === 'EMERGENCY' ? formData.priority : undefined,
                    ward: formData.visitType === 'IPD' ? formData.ward : undefined,
                }),
            });

            const encounterResult = await encounterResponse.json();

            if (!encounterResponse.ok) {
                toast({
                    title: "Patient Registered but Visit Creation Failed",
                    description: encounterResult.error || "Could not create visit",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Registration Complete",
                    description: `UHID: ${result.data.uhid} | Visit Started`,
                });
            }

            // Reset form
            setFormData({
                firstName: '', lastName: '', dob: '', gender: '', bloodGroup: '',
                phone: '', email: '', emergency: '', emergencyName: '', emergencyRelation: '',
                address: '', city: '', state: '', pincode: '', idType: '', idNumber: '',
                allergies: '', conditions: '', isTemporary: false,
                visitType: 'OPD', department: 'General Medicine', priority: 'GREEN', referredDoctor: '', ward: '',
            });

        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Registration failed',
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleQRScan = (data: AadhaarQRData) => {
        // Split name into first and last name
        const nameParts = data.name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        setFormData(prev => ({
            ...prev,
            firstName,
            lastName,
            dob: data.dob,
            gender: data.gender.toLowerCase(),
            address: data.address,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            idType: 'aadhaar',
            idNumber: data.uid ? `XXXX-XXXX-${getAadhaarLast4(data.uid)}` : '',
        }));

        setShowIdCapture(false);
        toast({
            title: 'Aadhaar QR Scanned',
            description: `Extracted details for ${data.name || 'patient'}. Please review and complete.`,
        });
    };

    return (
        <div className="max-w-5xl mx-auto pb-10 animate-fade-in font-inter">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        Smart Panjikaran
                    </h1>
                    <p className="text-slate-500 mt-2 ml-1 text-base">
                        New patient enrollment and admission intake.
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-sm self-start md:self-auto">
                    <Button 
                        variant="ghost" 
                        onClick={() => setShowIdCapture(true)}
                        className="text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl gap-2"
                    >
                        <QrCode className="w-4 h-4" />
                        Scan Aadhaar
                    </Button>
                    <div className="h-6 w-px bg-slate-200" />
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600 px-3 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            id="isTemporary"
                            checked={formData.isTemporary}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
                        />
                        Emergency Reg.
                    </label>
                </div>
            </div>

            {/* Success Banner */}
            {registeredPatient && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-900 text-sm uppercase tracking-wide">Registration Successful</h4>
                        <p className="text-emerald-700 mt-0.5">
                            UHID: <span className="font-mono font-bold bg-white/50 px-1.5 py-0.5 rounded text-emerald-800">{registeredPatient.uhid}</span> • {registeredPatient.name}
                        </p>
                    </div>
                </div>
            )}

            {/* Duplicate Warning */}
            {duplicates.length > 0 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                        </div>
                        <h4 className="font-bold text-amber-800">Potential Duplicates Found</h4>
                    </div>
                    <ul className="space-y-2">
                        {duplicates.map(d => (
                            <li key={d.id} className="text-sm text-amber-700 bg-white/60 p-2 rounded-lg border border-amber-100/50 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <b>{d.name}</b> <span className="font-mono opacity-80">({d.uhid})</span> <span className="text-amber-600/70 text-xs">- {d.similarity} match</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid lg:grid-cols-12 gap-6">
                    {/* Left Column - Personal Info */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Personal Details Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                                <Users className="w-5 h-5 text-violet-500" />
                                Personal Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="firstName" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">First Name</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20" required />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="lastName" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Name</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="dob" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</Label>
                                    <Input id="dob" type="date" value={formData.dob} onChange={handleChange} className="h-10 border-slate-200 focus:border-violet-500 focus:ring-violet-500/20" required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="gender" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</Label>
                                        <select id="gender" value={formData.gender} onChange={handleChange} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all" required>
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="bloodGroup" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blood Group</Label>
                                        <select id="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all">
                                            <option value="">Select</option>
                                            <option value="A+">A+</option>
                                            <option value="A-">A-</option>
                                            <option value="B+">B+</option>
                                            <option value="B-">B-</option>
                                            <option value="O+">O+</option>
                                            <option value="O-">O-</option>
                                            <option value="AB+">AB+</option>
                                            <option value="AB-">AB-</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Address & Contact Card */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                                <MapPin className="w-5 h-5 text-indigo-500" />
                                Address & Contact
                            </h3>
                            <div className="space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mobile Number</Label>
                                        <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="+91 99999 99999" className="h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" required />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</Label>
                                        <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="john.doe@example.com" className="h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="address" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Street Address</Label>
                                    <Input id="address" value={formData.address} onChange={handleChange} placeholder="Flat No, Building, Street" className="h-10 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="city" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">City</Label>
                                        <Input id="city" value={formData.city} onChange={handleChange} className="h-10 border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="state" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State</Label>
                                        <Input id="state" value={formData.state} onChange={handleChange} className="h-10 border-slate-200" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pincode" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pincode</Label>
                                        <Input id="pincode" value={formData.pincode} onChange={handleChange} className="h-10 border-slate-200" />
                                    </div>
                                </div>
                            </div>
                        </div>

                         {/* ID Verification Card */}
                         <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                                <FileText className="w-5 h-5 text-blue-500" />
                                Identity Proof
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5">
                                    <Label htmlFor="idType" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Type</Label>
                                    <select id="idType" value={formData.idType} onChange={handleChange} className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all">
                                        <option value="">Select Document</option>
                                        <option value="aadhaar">Aadhaar Card</option>
                                        <option value="pan">PAN Card</option>
                                        <option value="passport">Passport</option>
                                        <option value="voter">Voter ID</option>
                                        <option value="driving">Driving License</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="idNumber" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Document Number</Label>
                                    <Input id="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="XXXX-XXXX-XXXX" className="h-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Visit & History */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Visit Details Card (Highlighted) */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl opacity-60 -mr-20 -mt-20 pointer-events-none" />
                            
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 relative z-10 pb-4 border-b border-slate-100">
                                <Activity className="w-5 h-5 text-violet-500" />
                                Visit Details
                            </h3>
                            
                            <div className="space-y-5 relative z-10">
                                <div className="space-y-1.5">
                                    <Label htmlFor="visitType" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visit Type</Label>
                                    <select id="visitType" value={formData.visitType} onChange={handleChange} className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all">
                                        <option value="OPD">OPD (Outpatient)</option>
                                        <option value="EMERGENCY">Emergency</option>
                                        <option value="IPD">IPD (Admission)</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="department" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Department</Label>
                                    <select id="department" value={formData.department} onChange={handleChange} className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all">
                                        <option value="General Medicine">General Medicine</option>
                                        <option value="Orthopedics">Orthopedics</option>
                                        <option value="Pediatrics">Pediatrics</option>
                                        <option value="Cardiology">Cardiology</option>
                                        <option value="Gynecology">Gynecology</option>
                                        <option value="Dermatology">Dermatology</option>
                                        <option value="ENT">ENT</option>
                                    </select>
                                </div>

                                {formData.visitType === 'OPD' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                        <Label htmlFor="referredDoctor" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consulting Doctor</Label>
                                        <select id="referredDoctor" value={formData.referredDoctor} onChange={handleChange} className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all" required>
                                            <option value="" className="text-slate-500">Select Doctor</option>
                                            {loadingDoctors ? (
                                                <option disabled>Loading...</option>
                                            ) : (
                                                doctors.map(doctor => (
                                                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                                                ))
                                            )}
                                        </select>
                                    </div>
                                )}

                                {formData.visitType === 'EMERGENCY' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                        <Label htmlFor="priority" className="text-xs font-semibold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> Triage
                                        </Label>
                                        <select id="priority" value={formData.priority} onChange={handleChange} className="w-full h-11 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-bold">
                                            <option value="RED">🔴 RED (Critical)</option>
                                            <option value="ORANGE">🟠 ORANGE (Urgent)</option>
                                            <option value="YELLOW">🟡 YELLOW (Warning)</option>
                                            <option value="GREEN">🟢 GREEN (Minor)</option>
                                        </select>
                                    </div>
                                )}
                                
                                {formData.visitType === 'IPD' && (
                                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1">
                                        <Label htmlFor="ward" className="text-xs font-semibold text-teal-600 uppercase tracking-wider">Ward Allocation</Label>
                                        <select id="ward" value={formData.ward} onChange={handleChange} className="w-full h-11 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all" required>
                                            <option value="">Select Ward</option>
                                            <option value="Emergency">Emergency</option>
                                            <option value="ICU">ICU</option>
                                            <option value="General ward A">General Ward A</option>
                                            <option value="General ward B">General Ward B</option>
                                            <option value="Private Room (Single)">Private Room (Single)</option>
                                            <option value="Private Room (Double)">Private Room (Double)</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                         {/* Emergency Contact */}
                         <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                                <AlertCircle className="w-5 h-5 text-rose-500" />
                                Emergency Contact
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="emergencyName" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</Label>
                                    <Input id="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder="Guardian Name" className="h-10 border-slate-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="emergency" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Number</Label>
                                    <Input id="emergency" value={formData.emergency} onChange={handleChange} placeholder="+91 " className="h-10 border-slate-200" />
                                </div>
                            </div>
                        </div>

                        {/* Medical History Brief */}
                        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2 pb-4 border-b border-slate-100">
                                <Stethoscope className="w-5 h-5 text-teal-500" />
                                Medical Brief
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="allergies" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Allergies</Label>
                                    <Input id="allergies" value={formData.allergies} onChange={handleChange} placeholder="Comma separated" className="h-10 border-slate-200" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="conditions" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pre-existing Conditions</Label>
                                    <Input id="conditions" value={formData.conditions} onChange={handleChange} placeholder="Diabetes, Hypertension..." className="h-10 border-slate-200" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-4 z-10 flex justify-end gap-3 p-4 bg-white/80 backdrop-blur-md border border-slate-200 shadow-lg rounded-2xl max-w-5xl mx-auto">
                    <Button type="button" variant="outline" onClick={() => window.history.back()} className="rounded-xl px-6 h-11 border-slate-300 text-slate-700 hover:bg-slate-50">
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="rounded-xl px-8 h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200 transition-all hover:scale-105 active:scale-95">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Complete Registration
                    </Button>
                </div>
            </form>

            {/* Aadhaar QR Scanner Modal */}
            {showIdCapture && (
                <QRScanner
                    onScan={handleQRScan}
                    onClose={() => setShowIdCapture(false)}
                />
            )}
        </div>
    );
}
