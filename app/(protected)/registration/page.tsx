"use client";

import { UserPlus, Users, FileText, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegistrationPage() {
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
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <div className="floating-card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Personal Information
                    </h3>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="firstName">First Name</Label>
                                <Input id="firstName" placeholder="Enter first name" className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input id="lastName" placeholder="Enter last name" className="mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="dob">Date of Birth</Label>
                                <Input id="dob" type="date" className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="gender">Gender</Label>
                                <select id="gender" className="elegant-select mt-1">
                                    <option value="">Select gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="bloodGroup">Blood Group</Label>
                            <select id="bloodGroup" className="elegant-select mt-1">
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
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" placeholder="+91 " className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" placeholder="patient@email.com" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="emergency">Emergency Contact</Label>
                            <Input id="emergency" placeholder="+91 " className="mt-1" />
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
                            <Input id="address" placeholder="Enter street address" className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="city">City</Label>
                                <Input id="city" placeholder="City" className="mt-1" />
                            </div>
                            <div>
                                <Label htmlFor="pincode">PIN Code</Label>
                                <Input id="pincode" placeholder="000000" className="mt-1" />
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
                            <select id="idType" className="elegant-select mt-1">
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
                            <Input id="idNumber" placeholder="Enter ID number" className="mt-1" />
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
                            <Input id="allergies" placeholder="Enter any known allergies (comma separated)" className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="conditions">Pre-existing Conditions</Label>
                            <Input id="conditions" placeholder="Enter any pre-existing conditions" className="mt-1" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="outline">Cancel</Button>
                <Button>Register Patient</Button>
            </div>
        </div>
    );
}
