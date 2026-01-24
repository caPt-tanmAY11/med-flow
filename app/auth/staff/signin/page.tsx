"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users, Mail, Lock, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

export default function StaffSignInPage() {
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
            <div className="hidden lg:flex items-center justify-center relative bg-gradient-to-br from-teal-500/5 to-primary/5">
                <div className="relative z-10 max-w-md text-center px-8">
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-white shadow-soft flex items-center justify-center mb-6">
                        <Users className="w-10 h-10 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-semibold text-foreground mb-3">
                        Staff Portal
                    </h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Access the hospital management system, patient care tools, and administrative functions.
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
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                                <Users className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">Staff Sign In</h1>
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
                                        placeholder="staff@hospital.com"
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
                                className="w-full rounded-xl py-5 text-base shadow-lift bg-teal-600 hover:bg-teal-700"
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
                                    href="/auth/staff/register" 
                                    className="text-teal-600 hover:underline font-medium"
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
