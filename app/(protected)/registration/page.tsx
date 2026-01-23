"use client";

import { useState } from 'react';
import { UserPlus, Users, FileText, Phone, MapPin, AlertCircle, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
}

export default function RegistrationPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [duplicates, setDuplicates] = useState<{ id: string; uhid: string; name: string; similarity: string }[]>([]);
    const [registeredPatient, setRegisteredPatient] = useState<{ uhid: string; name: string } | null>(null);

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

            toast({
                title: "Patient Registered",
                description: `UHID: ${result.data.uhid}`,
            });

            // Reset form
            setFormData({
                firstName: '', lastName: '', dob: '', gender: '', bloodGroup: '',
                phone: '', email: '', emergency: '', emergencyName: '', emergencyRelation: '',
                address: '', city: '', state: '', pincode: '', idType: '', idNumber: '',
                allergies: '', conditions: '', isTemporary: false,
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

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                        <UserPlus className="w-6 h-6 text-primary" />
                        Patient Registration
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Register a new patient in the hospital system
                    </p>
                </div>
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
                </div>

                <div className="flex justify-end gap-4 mt-6">
                    <Button type="button" variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                    <Button type="submit" disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Register Patient
                    </Button>
                </div>
            </form>
        </div>
    );
}
