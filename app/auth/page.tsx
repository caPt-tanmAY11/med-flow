"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Stethoscope, User, Users, ArrowRight, Lock, KeyRound } from "lucide-react";
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
            // Keep dialog open during redirect or close it? 
            // Better to keep it open or just let the page navigate away.
        } else {
            toast.error("Incorrect Staff PIN");
            setPin(""); // Clear pin on error
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal-600 shadow-lg flex items-center justify-center mb-6">
                        <Stethoscope className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to MedFlow</h1>
                    <p className="text-muted-foreground">
                        Choose how you&apos;d like to continue
                    </p>
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Patient Option */}
                    <button
                        onClick={() => router.push("/auth/patient/signin")}
                        onMouseEnter={() => setHoveredOption("patient")}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={cn(
                            "relative rounded-2xl bg-white border-2 p-8 text-left transition-all duration-300",
                            "hover:shadow-lift hover:border-primary/50",
                            hoveredOption === "patient" ? "border-primary/50 shadow-lift" : "border-neutral-200"
                        )}
                    >
                        <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors",
                            hoveredOption === "patient" ? "bg-primary/10" : "bg-neutral-100"
                        )}>
                            <User className={cn(
                                "w-7 h-7 transition-colors",
                                hoveredOption === "patient" ? "text-primary" : "text-muted-foreground"
                            )} />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Continue as Patient
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Access your medical records, appointments, and health information
                        </p>
                        <div className={cn(
                            "flex items-center text-sm font-medium transition-colors",
                            hoveredOption === "patient" ? "text-primary" : "text-muted-foreground"
                        )}>
                            Sign in to your account
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                    </button>

                    {/* Staff Option */}
                    <button
                        onClick={handleStaffClick}
                        onMouseEnter={() => setHoveredOption("staff")}
                        onMouseLeave={() => setHoveredOption(null)}
                        className={cn(
                            "relative rounded-2xl bg-white border-2 p-8 text-left transition-all duration-300",
                            "hover:shadow-lift hover:border-teal-500/50",
                            hoveredOption === "staff" ? "border-teal-500/50 shadow-lift" : "border-neutral-200"
                        )}
                    >
                        <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors",
                            hoveredOption === "staff" ? "bg-teal-500/10" : "bg-neutral-100"
                        )}>
                            <Users className={cn(
                                "w-7 h-7 transition-colors",
                                hoveredOption === "staff" ? "text-teal-600" : "text-muted-foreground"
                            )} />
                        </div>
                        <h2 className="text-xl font-semibold text-foreground mb-2">
                            Continue as Hospital Staff
                        </h2>
                        <p className="text-sm text-muted-foreground mb-4">
                            Access the hospital management system and patient care tools
                        </p>
                        <div className={cn(
                            "flex items-center text-sm font-medium transition-colors",
                            hoveredOption === "staff" ? "text-teal-600" : "text-muted-foreground"
                        )}>
                            Sign in to your account
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </div>
                    </button>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-8">
                    By continuing, you agree to MedFlow&apos;s Terms of Service and Privacy Policy
                </p>
            </div>

            {/* PIN Verification Dialog */}
            <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                            <Lock className="w-6 h-6 text-teal-600" />
                        </div>
                        <DialogTitle className="text-center text-xl">Staff Verification</DialogTitle>
                        <DialogDescription className="text-center">
                            Please enter the staff access PIN to continue.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex flex-col items-center justify-center space-y-6 py-4">
                        <InputOTP
                            maxLength={9}
                            value={pin}
                            onChange={(value) => setPin(value)}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                                <InputOTPSlot index={6} />
                                <InputOTPSlot index={7} />
                                <InputOTPSlot index={8} />
                            </InputOTPGroup>
                        </InputOTP>
                        
                        <div className="flex gap-2 w-full">
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setIsPinDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="w-full bg-teal-600 hover:bg-teal-700" 
                                onClick={handlePinSubmit}
                                disabled={isLoading || pin.length < 9}
                            >
                                {isLoading ? "Verifying..." : "Verify PIN"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
