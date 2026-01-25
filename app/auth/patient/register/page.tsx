"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Mail, Lock, UserCircle, Loader2, ArrowLeft, HeartPulse, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function PatientRegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

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
                role: "PATIENT",
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
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-6xl px-4 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                
                {/* Left Side - Abstract illustration/Branding (Order flipped on mobile usually, but keeping consistently left for desktop) */}
                <motion.div 
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6 }}
                    className="hidden lg:flex flex-col space-y-8 order-2 lg:order-1"
                >
                    <div className="inline-flex items-center space-x-3">
                         <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <HeartPulse className="w-7 h-7 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">MedFlow</span>
                    </div>
                    
                    <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                        Join the Future of <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">Healthcare.</span>
                    </h1>
                    
                    <div className="space-y-6 max-w-md">
                         <p className="text-lg text-slate-600 dark:text-slate-300">
                            Create your account today to experience seamless health management.
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-teal-500" />
                                <span>HIPAA Compliant</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                            <div className="flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                <span>Personalized Care</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side - Registration Form */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-md mx-auto order-1 lg:order-2"
                >
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-slate-200 dark:border-slate-800 backdrop-blur-xl relative overflow-hidden">
                        {/* Decorative gradient inside card */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-blue-500 to-teal-500" />

                        <div className="mb-8">
                             <Link 
                                href="/auth" 
                                className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-teal-600 transition-colors mb-6 group"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1 transition-transform group-hover:-translate-x-1" />
                                Back to options
                            </Link>
                            
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Create Account</h2>
                            <p className="text-slate-500 dark:text-slate-400">
                                Enter your details to register as a patient
                            </p>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-teal-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-teal-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all rounded-xl"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-teal-500" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 transition-colors group-focus-within:text-teal-500" />
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            placeholder="••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 h-11 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11 text-base font-medium rounded-xl bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    "Create Account"
                                )}
                            </Button>
                        </form>

                        <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
                             <p className="text-sm text-slate-500 dark:text-slate-400">
                                Already have an account?{" "}
                                <Link 
                                    href="/auth/patient/signin" 
                                    className="text-teal-600 hover:text-teal-700 dark:text-teal-400 font-semibold hover:underline"
                                >
                                    Sign in instead
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
