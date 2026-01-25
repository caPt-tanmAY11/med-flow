"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { MedicineResult } from "../actions";

export type CartItem = MedicineResult & { quantity: number };

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (id: string, qty: number) => void;
    onRemove: (id: string) => void;
}

export function Cart({ items, onUpdateQuantity, onRemove }: CartProps) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-8 border rounded-lg border-dashed text-muted-foreground bg-muted/10 h-[200px]">
                <p>Cart is empty</p>
                <p className="text-sm">Search and add medicines to proceed.</p>
            </div>
        );
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Medicine</TableHead>
                        <TableHead className="w-[100px]">Price</TableHead>
                        <TableHead className="w-[120px]">Quantity</TableHead>
                        <TableHead className="w-[100px] text-right">Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">
                                {item.name}
                                <div className="text-xs text-muted-foreground">Max: {item.currentStock}</div>
                            </TableCell>
                            <TableCell>₹{item.price.toFixed(2)}</TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    min="1"
                                    max={item.currentStock}
                                    value={item.quantity}
                                    onChange={(e) => onUpdateQuantity(item.id, parseInt(e.target.value) || 1)}
                                    className="h-8 w-20"
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                ₹{(item.price * item.quantity).toFixed(2)}
                            </TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onRemove(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
             <div className="p-4 bg-muted/20 flex justify-between items-center border-t">
                <span className="font-semibold text-muted-foreground">Subtotal</span>
                <span className="text-xl font-bold">₹{total.toFixed(2)}</span>
            </div>
        </div>
    );
}
