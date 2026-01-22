"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole, roleNames } from "@/context/AuthContext";
import { Stethoscope, Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const roles: UserRole[] = [
    "doctor",
    "nurse",
    "front_desk",
    "lab_technician",
    "pharmacist",
    "billing",
    "management",
    "admin",
];

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<UserRole>("doctor");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateEmail = (e: string) => {
        return /^\S+@\S+\.\S+$/.test(e);
    };

    const handleSubmit = (ev?: React.FormEvent) => {
        ev?.preventDefault();
        setError(null);

        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        if (!validateEmail(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        setIsSubmitting(true);
        login(selectedRole);
        router.push("/dashboard");
    };

    const [roleOpen, setRoleOpen] = useState(false);

    return (
        <div className="min-h-screen bg-neutral-50 grid grid-cols-1 lg:grid-cols-2">
            <div className="hidden lg:flex items-center justify-center relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                <div className="relative z-10 flex flex-col items-center text-center px-16 max-w-xl">
                    <h2 className="text-3xl font-semibold text-foreground mb-2 tracking-tight">
                        Welcome to Medflow
                    </h2>

                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                        A unified hospital information system designed for doctors, nurses,
                        and healthcare administrators.
                    </p>

                    <img
                        src="/login/doodle.png"
                        alt="hospital doodle"
                        className="w-[420px] object-contain select-none"
                        draggable={false}
                    />
                </div>
            </div>

            <div className="flex items-center justify-center px-6">
                <div className="w-full max-w-md">
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-3xl bg-white border border-neutral-200 shadow-panel p-8"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">Sign in to Medflow</h1>
                                <p className="text-xs text-muted-foreground">
                                    Access your hospital workspace
                                </p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs text-muted-foreground mb-2">Email</label>
                            <input
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                type="email"
                                placeholder="you@hospital.com"
                                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs text-muted-foreground mb-2">Password</label>
                            <div className="relative">
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm pr-12 focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                                >
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" />
                                            <path d="M10.7 5.1A9.8 9.8 0 0 1 12 5c5 0 9 7 9 7a17.4 17.4 0 0 1-3.3 4.4M6.5 6.5A17.5 17.5 0 0 0 3 12s4 7 9 7c1.1 0 2.1-.2 3-.6" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2"/>
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>


                        <div className="mb-5">
                            <label className="block text-xs text-muted-foreground mb-2">
                                Select Role
                            </label>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setRoleOpen((v) => !v)}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition",
                                        roleOpen
                                            ? "border-primary ring-2 ring-primary/20"
                                            : "border-neutral-200 hover:bg-neutral-50"
                                    )}
                                >
                                    <span className="text-foreground">
                                        {roleNames[selectedRole]}
                                    </span>

                                    <svg
                                        className={cn(
                                            "w-4 h-4 transition-transform",
                                            roleOpen && "rotate-180"
                                        )}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                </button>

                                {roleOpen && (
                                    <div className="absolute z-50 mt-2 w-full rounded-xl border border-neutral-200 bg-white shadow-lg overflow-hidden">
                                        {roles.map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedRole(role);
                                                    setRoleOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full text-left px-4 py-3 text-sm transition flex items-center justify-between",
                                                    selectedRole === role
                                                        ? "bg-primary/10 text-primary"
                                                        : "hover:bg-neutral-50"
                                                )}
                                            >
                                                {roleNames[role]}

                                                {selectedRole === role && (
                                                    <Shield className="w-4 h-4" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && <div className="text-sm text-destructive mb-4">{error}</div>}

                        <div className="flex items-center justify-between mb-4">
                            <Link
                                href="/"
                                className="text-sm text-muted-foreground hover:text-primary transition flex items-center gap-1"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                Back to Home
                            </Link>

                            <span className="text-xs text-muted-foreground">
                                Need help? Contact admin
                            </span>
                        </div>

                        <Button
                            type="submit"
                            className="w-full rounded-xl py-5 text-base shadow-lift"
                            disabled={isSubmitting || !email || !password || !validateEmail(email)}
                        >
                            {isSubmitting ? "Logging in…" : `Login as ${roleNames[selectedRole]}`}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}


