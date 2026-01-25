"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, User, Users, ArrowRight, Lock, KeyRound, Activity, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AuthLandingPage() {
    const router = useRouter();
    const [hoveredOption, setHoveredOption] = useState<"patient" | "staff" | null>(null);
    
    // PIN Verification State
    const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Hardcoded PIN as per requirements
    const CORRECT_PIN = "123456789";

    const handleStaffClick = () => {
        setIsPinDialogOpen(true);
        setPin("");
    };

    const handlePinSubmit = async () => {
        if (!pin) return;
        
        setIsLoading(true);
        
        // Simulating a small delay for better UX (feels like verifying)
        await new Promise(resolve => setTimeout(resolve, 600));

        if (pin === CORRECT_PIN) {
            toast.success("Access Granted");
            router.push("/auth/staff/signin");
        } else {
            toast.error("Incorrect Staff PIN");
            setPin(""); // Clear pin on error
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Ambient Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-teal-500/10 rounded-full blur-[100px]" />
            </div>

            <div className="w-full max-w-5xl px-6 relative z-10">
                {/* Header Phase */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 space-y-4"
                >
                    <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white shadow-xl shadow-slate-200/50 dark:bg-slate-900 dark:shadow-slate-900/50 mb-2">
                         <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <span className="ml-3 text-xl font-bold tracking-tight text-slate-900 dark:text-white">MedFlow</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                        Access Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">Workspace</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        Secure, role-based access to the hospital management ecosystem.
                    </p>
                </motion.div>

                {/* Cards Container */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
                    {/* Patient Option */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        onClick={() => router.push("/auth/patient/signin")}
                        onMouseEnter={() => setHoveredOption("patient")}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={cn(
                            "group relative flex flex-col items-center text-center p-8 h-full rounded-3xl transition-all duration-300",
                            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                            "hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10",
                            hoveredOption === "patient" && "-translate-y-1"
                        )}
                    >
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
                            "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
                            "group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white"
                        )}>
                            <User className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Patient Portal
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Access personal health records, upcoming appointments, and prescriptions.
                        </p>
                        <div className={cn(
                            "mt-auto flex items-center font-semibold text-sm transition-colors duration-300",
                            "text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300"
                        )}>
                            Continue as Patient
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </div>
                    </motion.button>

                    {/* Staff Option */}
                    <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        onClick={handleStaffClick}
                        onMouseEnter={() => setHoveredOption("staff")}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={cn(
                            "group relative flex flex-col items-center text-center p-8 h-full rounded-3xl transition-all duration-300",
                            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
                            "hover:border-teal-500/50 hover:shadow-2xl hover:shadow-teal-500/10",
                            hoveredOption === "staff" && "-translate-y-1"
                        )}
                    >
                        <div className={cn(
                            "w-20 h-20 rounded-full flex items-center justify-center mb-6 transition-all duration-300",
                            "bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400",
                            "group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white"
                        )}>
                            <Users className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                            Staff Access
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Secure login for doctors, nurses, and administrative personnel.
                        </p>
                        <div className={cn(
                            "mt-auto flex items-center font-semibold text-sm transition-colors duration-300",
                            "text-teal-600 dark:text-teal-400 group-hover:text-teal-700 dark:group-hover:text-teal-300"
                        )}>
                            Continue as Staff
                            <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </div>
                    </motion.button>
                </div>

                {/* Footer */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col items-center justify-center mt-12 space-y-4"
                >
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <ShieldCheck className="w-4 h-4" />
                        <span>HIPAA Compliant Security</span>
                    </div>
                </motion.div>
            </div>

            {/* PIN Verification Dialog */}
            <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-center text-white">
                        <div className="mx-auto w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 backdrop-blur-sm">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                        <DialogTitle className="text-2xl font-bold mb-1">Staff Verification</DialogTitle>
                        <DialogDescription className="text-teal-100">
                            Authorized personnel only
                        </DialogDescription>
                    </div>
                    
                    <div className="p-8 bg-white dark:bg-slate-950">
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="space-y-2 text-center w-full">
                                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Enter Access PIN
                                </label>
                                <InputOTP
                                    maxLength={9}
                                    value={pin}
                                    onChange={(value) => setPin(value)}
                                    className="gap-2"
                                >
                                    <InputOTPGroup className="justify-center">
                                        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                                            <InputOTPSlot 
                                                key={index} 
                                                index={index} 
                                                className="w-8 h-10 border-slate-200 dark:border-slate-800"
                                            />
                                        ))}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            
                            <div className="flex gap-3 w-full pt-2">
                                <Button 
                                    variant="outline" 
                                    className="flex-1 h-11 border-slate-200 dark:border-slate-800 hover:bg-slate-50"
                                    onClick={() => setIsPinDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    className="flex-1 h-11 bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-500/20" 
                                    onClick={handlePinSubmit}
                                    disabled={isLoading || pin.length < 9}
                                >
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            <span>Verifying...</span>
                                        </div>
                                    ) : (
                                        "Verify PIN"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
