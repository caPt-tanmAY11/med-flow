"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { addStock, issueStock, StockItem } from "../actions";
import { toast } from "sonner";
import { Loader2, Plus, Minus } from "lucide-react";

export function StockActionDialog({ 
    item, 
    action 
}: { 
    item: StockItem; 
    action: "add" | "issue" 
}) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [quantity, setQuantity] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (action === "add") {
        const res = await addStock({
          itemId: item.id,
          batchNumber,
          quantity: parseInt(quantity),
          expiryDate: new Date(expiryDate),
          costPrice: parseFloat(costPrice),
        });
        if (res.success) {
            toast.success("Stock added successfully");
            setOpen(false);
        } else {
            toast.error(res.error || "Failed to add stock");
        }
      } else {
        const res = await issueStock(item.id, parseInt(quantity), notes);
        if (res.success) {
            toast.success("Stock issued successfully (FEFO Applied)");
            setOpen(false);
        } else {
             toast.error(res.error || "Failed to issue stock");
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={action === "add" ? "outline" : "destructive"} size="sm" className="gap-2">
            {action === "add" ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
            {action === "add" ? "Add Stock" : "Issue"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{action === "add" ? "Add New Batch" : "Issue Stock"}</DialogTitle>
          <DialogDescription>
            {action === "add" 
                ? `Add new stock for ${item.name}. This will create a new batch.` 
                : `Issue stock for ${item.name}. Stock will be deducted from the oldest batch (FEFO).`
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Quantity</Label>
                <Input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="col-span-3"
                    required
                    min="1"
                />
            </div>
            
            {action === "add" && (
                <>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="batchNumber" className="text-right">Batch #</Label>
                        <Input
                            id="batchNumber"
                            value={batchNumber}
                            onChange={(e) => setBatchNumber(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="expiryDate" className="text-right">Expiry</Label>
                        <Input
                            id="expiryDate"
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="costPrice" className="text-right">Cost Price</Label>
                        <Input
                            id="costPrice"
                            type="number"
                            step="0.01"
                            value={costPrice}
                            onChange={(e) => setCostPrice(e.target.value)}
                            className="col-span-3"
                            required
                        />
                    </div>
                </>
            )}

            {action === "issue" && (
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="notes" className="text-right">Notes</Label>
                    <Input
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="col-span-3"
                        placeholder="Reason for issue..."
                    />
                </div>
            )}

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {action === "add" ? "Save Batch" : "Confirm Issue"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
