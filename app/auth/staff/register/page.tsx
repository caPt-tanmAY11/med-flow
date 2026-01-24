"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Mail, Lock, UserCircle, Loader2, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";

const STAFF_ROLES = [
    { value: "ADMIN", label: "Administrator" },
    { value: "DOCTOR", label: "Doctor" },
    { value: "NURSE", label: "Nurse" },
    { value: "FRONT_DESK", label: "Front Desk" },
    { value: "LAB_TECHNICIAN", label: "Lab Technician" },
    { value: "PHARMACIST", label: "Pharmacist" },
    { value: "BILLING", label: "Billing & Insurance" },
    { value: "MANAGEMENT", label: "Management" },
    { value: "NURSING_ADMIN", label: "Nursing Admin" },
] as const;

type StaffRole = typeof STAFF_ROLES[number]["value"];

export default function StaffRegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<StaffRole | "">("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!role) {
            toast.error("Please select a role");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        try {
            const result = await signUp.email({
                name,
                email,
                password,
                role,
            });

            if (result.error) {
                toast.error(result.error.message || "Failed to create account");
                setIsLoading(false);
                return;
            }

            toast.success("Account created successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Registration error:", error);
            toast.error("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT — Illustration */}
            <div className="hidden lg:flex items-center justify-center relative bg-gradient-to-br from-teal-500/5 to-primary/5">
                <div className="relative z-10 max-w-md text-center px-8">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white shadow-soft flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-semibold text-foreground mb-3">
                        Register as Staff
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Create your hospital staff account with your designated role to access the management system.
                    </p>
                </div>
            </div>

            {/* RIGHT — Registration Form */}
            <div className="flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">
                    <div className="rounded-3xl bg-white border border-neutral-200 shadow-panel p-8">
                        {/* Back Button */}
                        <Link 
                            href="/auth" 
                            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to options
                        </Link>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">Staff Registration</h1>
                                <p className="text-xs text-muted-foreground">
                                    Create your hospital staff account
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Dr. Jane Smith"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="staff@hospital.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Select value={role} onValueChange={(value: StaffRole) => setRole(value)}>
                                    <SelectTrigger className="w-full">
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4 text-muted-foreground" />
                                            <SelectValue placeholder="Select your role" />
                                        </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STAFF_ROLES.map((roleOption) => (
                                            <SelectItem key={roleOption.value} value={roleOption.value}>
                                                {roleOption.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full rounded-xl py-5 text-base shadow-lift bg-teal-600 hover:bg-teal-700"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Staff Account"
                                )}
                            </Button>
                        </form>

                        {/* Sign In Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link 
                                    href="/auth/staff/signin" 
                                    className="text-teal-600 hover:underline font-medium"
                                >
                                    Sign in here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
