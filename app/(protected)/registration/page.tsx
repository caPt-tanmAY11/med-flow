"use client";

import { useState } from 'react';
import { UserPlus, Users, FileText, Phone, MapPin, AlertCircle, Loader2, CheckCircle, AlertTriangle, QrCode, Stethoscope, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import QRScanner from '@/components/QRScanner';
import { AadhaarQRData, getAadhaarLast4 } from '@/lib/aadhaar-qr';

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
    doctorReferred: string;
}

export default function RegistrationPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [duplicates, setDuplicates] = useState<{ id: string; uhid: string; name: string; similarity: string }[]>([]);
    const [registeredPatient, setRegisteredPatient] = useState<{ uhid: string; name: string } | null>(null);
    const [showIdCapture, setShowIdCapture] = useState(false);

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
        doctorReferred: '',
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
                    primaryDoctorId: formData.doctorReferred || undefined,
                    triageColor: formData.visitType === 'EMERGENCY' ? formData.priority : undefined,
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
                visitType: 'OPD', department: 'General Medicine', priority: 'GREEN', doctorReferred: '',
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
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-primary" />
                        SmartPanjikaran
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Register a new patient in the hospital system
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setShowIdCapture(true)}>
                        <QrCode className="w-4 h-4 mr-2" />
                        Scan Aadhaar QR
                    </Button>
                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            id="isTemporary"
                            checked={formData.isTemporary}
                            onChange={handleChange}
                            className="rounded"
                        />
                        Emergency/Temporary Registration
                    </label>
                </div>
            </div>

            {registeredPatient && (
                <div className="p-4 bg-status-success/10 border border-status-success/20 rounded-xl flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-status-success" />
                    <div>
                        <p className="font-medium text-status-success">Patient Registered Successfully</p>
                        <p className="text-sm">UHID: <span className="font-mono font-bold">{registeredPatient.uhid}</span> - {registeredPatient.name}</p>
                    </div>
                </div>
            )}

            {duplicates.length > 0 && (
                <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-status-warning" />
                        <p className="font-medium text-status-warning">Potential Duplicates Detected</p>
                    </div>
                    <ul className="text-sm space-y-1">
                        {duplicates.map(d => (
                            <li key={d.id}>• {d.name} ({d.uhid}) - matched by {d.similarity}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="grid lg:grid-cols-2 gap-6">
                    <div className="floating-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Personal Information And Details
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="firstName">First Name *</Label>
                                    <Input id="firstName" value={formData.firstName} onChange={handleChange} placeholder="Enter first name" className="mt-1" required />
                                </div>
                                <div>
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input id="lastName" value={formData.lastName} onChange={handleChange} placeholder="Enter last name" className="mt-1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="dob">Date of Birth *</Label>
                                    <Input id="dob" type="date" value={formData.dob} onChange={handleChange} className="mt-1" required />
                                </div>
                                <div>
                                    <Label htmlFor="gender">Gender *</Label>
                                    <select id="gender" value={formData.gender} onChange={handleChange} className="elegant-select mt-1" required>
                                        <option value="">Select gender</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="bloodGroup">Blood Group</Label>
                                <select id="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="elegant-select mt-1">
                                    <option value="">Select blood group</option>
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

                    <div className="floating-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Contact Information
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="phone">Phone Number *</Label>
                                <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="+91 " className="mt-1" required />
                            </div>
                            <div>
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="patient@email.com" className="mt-1" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="emergencyName">Emergency Contact Name</Label>
                                    <Input id="emergencyName" value={formData.emergencyName} onChange={handleChange} placeholder="Name" className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="emergency">Emergency Contact</Label>
                                    <Input id="emergency" value={formData.emergency} onChange={handleChange} placeholder="+91 " className="mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="floating-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Address
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="address">Street Address</Label>
                                <Input id="address" value={formData.address} onChange={handleChange} placeholder="Enter street address" className="mt-1" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="city">City</Label>
                                    <Input id="city" value={formData.city} onChange={handleChange} placeholder="City" className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="state">State</Label>
                                    <Input id="state" value={formData.state} onChange={handleChange} placeholder="State" className="mt-1" />
                                </div>
                                <div>
                                    <Label htmlFor="pincode">PIN Code</Label>
                                    <Input id="pincode" value={formData.pincode} onChange={handleChange} placeholder="000000" className="mt-1" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="floating-card">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            ID Verification
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="idType">ID Type</Label>
                                <select id="idType" value={formData.idType} onChange={handleChange} className="elegant-select mt-1">
                                    <option value="">Select ID type</option>
                                    <option value="aadhaar">Aadhaar Card</option>
                                    <option value="pan">PAN Card</option>
                                    <option value="passport">Passport</option>
                                    <option value="voter">Voter ID</option>
                                    <option value="driving">Driving License</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="idNumber">ID Number</Label>
                                <Input id="idNumber" value={formData.idNumber} onChange={handleChange} placeholder="Enter ID number" className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="floating-card lg:col-span-2">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Medical History
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="allergies">Known Allergies</Label>
                                <Input id="allergies" value={formData.allergies} onChange={handleChange} placeholder="Enter any known allergies (comma separated)" className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="conditions">Pre-existing Conditions</Label>
                                <Input id="conditions" value={formData.conditions} onChange={handleChange} placeholder="Enter any pre-existing conditions" className="mt-1" />
                            </div>
                        </div>
                    </div>

                    <div className="floating-card lg:col-span-2 border-primary/20 bg-primary/5">
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary">
                            <Stethoscope className="w-4 h-4" />
                            Visit Details (Intake)
                        </h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <Label htmlFor="visitType">Visit Type</Label>
                                <select id="visitType" value={formData.visitType} onChange={handleChange} className="elegant-select mt-1 font-medium">
                                    <option value="OPD">OPD (Outpatient)</option>
                                    <option value="EMERGENCY">Emergency / Casualty</option>
                                    <option value="IPD">IPD (Admission)</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="department">Department</Label>
                                <select id="department" value={formData.department} onChange={handleChange} className="elegant-select mt-1">
                                    <option value="General Medicine">General Medicine</option>
                                    <option value="Orthopedics">Orthopedics</option>
                                    <option value="Pediatrics">Pediatrics</option>
                                    <option value="Cardiology">Cardiology</option>
                                    <option value="Gynecology">Gynecology</option>
                                    <option value="Dermatology">Dermatology</option>
                                    <option value="ENT">ENT</option>
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="doctorReferred">Referred Doctor</Label>
                                <select id="doctorReferred" value={formData.doctorReferred} onChange={handleChange} className="elegant-select mt-1">
                                    <option value="">-- Select Doctor (Optional) --</option>
                                    <option value="dr-sharma">Dr. Sharma (General Medicine)</option>
                                    <option value="dr-patel">Dr. Patel (Orthopedics)</option>
                                    <option value="dr-gupta">Dr. Gupta (Pediatrics)</option>
                                    <option value="dr-singh">Dr. Singh (Cardiology)</option>
                                    <option value="dr-verma">Dr. Verma (Gynecology)</option>
                                    <option value="dr-khan">Dr. Khan (Dermatology)</option>
                                    <option value="dr-reddy">Dr. Reddy (ENT)</option>
                                </select>
                            </div>
                            {formData.visitType === 'EMERGENCY' && (
                                <div className="animate-fade-in">
                                    <Label htmlFor="priority" className="flex items-center gap-2">
                                        <Activity className="w-4 h-4" /> Triage Priority
                                    </Label>
                                    <select id="priority" value={formData.priority} onChange={handleChange} className="elegant-select mt-1 border-status-critical/50 text-status-critical font-bold">
                                        <option value="RED">🔴 RED (Immediate)</option>
                                        <option value="ORANGE">🟠 ORANGE (Very Urgent)</option>
                                        <option value="YELLOW">🟡 YELLOW (Urgent)</option>
                                        <option value="GREEN">🟢 GREEN (Standard)</option>
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Register Patient
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
