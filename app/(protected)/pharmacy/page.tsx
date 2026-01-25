"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User, ShoppingCart, CreditCard, ChevronRight } from "lucide-react";
import { PatientSearch } from "./_components/PatientSearch";
import { MedicineSearch } from "./_components/MedicineSearch";
import { Cart, CartItem } from "./_components/Cart";
import { OrderSuccess } from "./_components/OrderSuccess";
import { PatientResult, MedicineResult, processSale } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function PharmacyPage() {
    const [step, setStep] = useState<"patient" | "cart" | "success">("patient");
    const [patient, setPatient] = useState<PatientResult | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [deliveryMode, setDeliveryMode] = useState<"COUNTER" | "ROOM">("COUNTER");
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastBillId, setLastBillId] = useState<string | null>(null);

    const addToCart = (med: MedicineResult) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === med.id);
            if (existing) {
                if (existing.quantity >= med.currentStock) {
                    toast.error("Max stock reached");
                    return prev;
                }
                return prev.map(item => item.id === med.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...med, quantity: 1 }];
        });
        toast.success("Added to cart");
    };

    const updateQuantity = (id: string, qty: number) => {
        setCart(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.min(qty, item.currentStock) } : item));
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const handleCheckout = async () => {
        if (!patient || cart.length === 0) return;
        setIsProcessing(true);
        
        try {
            const result = await processSale({
                patientId: patient.id,
                items: cart.map(item => ({ itemId: item.id, quantity: item.quantity, price: item.price })),
                deliveryMode
            });

            if (result.success && result.billId) {
                setLastBillId(result.billId);
                setStep("success");
                toast.success("Sale processed successfully");
            } else {
                toast.error(result.error || "Failed to process sale");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const resetSale = () => {
        setPatient(null);
        setCart([]);
        setStep("patient");
        setLastBillId(null);
        setDeliveryMode("COUNTER");
    };

    return (
        <div className="flex-1 p-8 pt-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pharmacy</h2>
                    <p className="text-muted-foreground">Medicine Sales & Billing</p>
                </div>
                {step !== "success" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={step === "patient" ? "font-bold text-primary" : ""}>1. Patient</span>
                        <ChevronRight className="h-4 w-4" />
                        <span className={step === "cart" ? "font-bold text-primary" : ""}>2. Cart & Bill</span>
                    </div>
                )}
            </div>

            {step === "success" && lastBillId ? (
                <OrderSuccess billId={lastBillId} onReset={resetSale} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left Column: Context & Patient */}
                    <div className="space-y-6">
                        <Card className={step === "patient" ? "border-primary shadow-md" : ""}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <User className="h-5 w-5" />
                                    Patient Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {patient ? (
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold">{patient.name}</p>
                                                <p className="text-sm text-muted-foreground">{patient.gender}, {patient.age}y</p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => { setPatient(null); setStep("patient"); }}>Change</Button>
                                        </div>
                                        <Separator />
                                        {patient.activeEncounter ? (
                                             <div className="text-sm">
                                                <span className="text-green-600 font-medium">Active Visit</span>
                                                <p className="text-muted-foreground">Dept: {patient.activeEncounter.type}</p>
                                                {patient.activeEncounter.currentLocation && <p className="text-muted-foreground">Loc: {patient.activeEncounter.currentLocation}</p>}
                                             </div>
                                        ) : (
                                            <div className="text-sm text-amber-600 font-medium">
                                                No active visit (Walk-in)
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <PatientSearch onSelect={(p) => { setPatient(p); setStep("cart"); }} />
                                )}

                                {patient && (
                                    <div className="pt-4">
                                        <Label className="mb-2 block">Delivery Mode</Label>
                                        <RadioGroup value={deliveryMode} onValueChange={(v: "COUNTER" | "ROOM") => setDeliveryMode(v)} className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                                                <RadioGroupItem value="COUNTER" id="r_counter" />
                                                <Label htmlFor="r_counter" className="cursor-pointer">Counter Pickup</Label>
                                            </div>
                                            <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 cursor-pointer">
                                                <RadioGroupItem value="ROOM" id="r_room" disabled={!patient.activeEncounter} />
                                                <Label htmlFor="r_room" className={!patient.activeEncounter ? "opacity-50" : "cursor-pointer"}>Room Delivery</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Cart & Search */}
                    <div className="md:col-span-2 space-y-6">
                        {patient && (
                            <Card className="min-h-[500px] flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <ShoppingCart className="h-5 w-5" />
                                        Sale Items
                                    </CardTitle>
                                    <CardDescription>Search and add medicines to the bill</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 space-y-6 flex flex-col">
                                    <div className="max-w-md">
                                         <MedicineSearch onSelect={addToCart} />
                                    </div>
                                    
                                    <div className="flex-1">
                                        <Cart items={cart} onUpdateQuantity={updateQuantity} onRemove={removeFromCart} />
                                    </div>

                                    <div className="flex justify-end pt-4 border-t">
                                        <Button 
                                            size="lg" 
                                            disabled={cart.length === 0 || isProcessing} 
                                            onClick={handleCheckout}
                                            className="bg-teal-600 hover:bg-teal-700 min-w-[200px]"
                                        >
                                            {isProcessing ? "Processing..." : (
                                                <span className="flex items-center gap-2">
                                                    <CreditCard className="h-4 w-4" />
                                                    Finalize Sale & Print
                                                </span>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
