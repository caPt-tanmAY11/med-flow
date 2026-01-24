"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

export default function PatientSignInPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await signIn.email({
                email,
                password,
            });

            if (result.error) {
                toast.error(result.error.message || "Failed to sign in");
                setIsLoading(false);
                return;
            }

            toast.success("Signed in successfully!");
            router.push("/dashboard");
        } catch (error) {
            console.error("Sign in error:", error);
            toast.error("An unexpected error occurred");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 grid grid-cols-1 lg:grid-cols-2">
            {/* LEFT — Illustration */}
            <div className="hidden lg:flex items-center justify-center relative bg-gradient-to-br from-primary/5 to-teal-500/5">
                <div className="relative z-10 max-w-md text-center px-8">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white shadow-soft flex items-center justify-center mb-6">
                        <User className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-semibold text-foreground mb-3">
                        Patient Portal
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Access your medical records, view appointments, and manage your health information securely.
                    </p>
                </div>
            </div>

            {/* RIGHT — Sign In Form */}
            <div className="flex items-center justify-center px-6">
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
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">Patient Sign In</h1>
                                <p className="text-xs text-muted-foreground">
                                    Enter your credentials to continue
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignIn} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="patient@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
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

                            <Button
                                type="submit"
                                className="w-full rounded-xl py-5 text-base shadow-lift"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Signing in...
                                    </>
                                ) : (
                                    "Sign In"
                                )}
                            </Button>
                        </form>

                        {/* Register Link */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Don&apos;t have an account?{" "}
                                <Link 
                                    href="/auth/patient/register" 
                                    className="text-primary hover:underline font-medium"
                                >
                                    Register here
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
