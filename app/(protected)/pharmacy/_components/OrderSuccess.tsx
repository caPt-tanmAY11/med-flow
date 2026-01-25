"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2, Printer } from "lucide-react";

export function OrderSuccess({ billId, onReset }: { billId: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
        <CheckCircle2 className="w-10 h-10" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Order Processed!</h2>
        <p className="text-muted-foreground max-w-[400px]">
          The medicines have been billed and inventory updated successfully.
          <br/>
          <span className="font-mono text-xs">Ref: {billId}</span>
        </p>
      </div>

      <div className="flex gap-4 pt-4">
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
           <Printer className="w-4 h-4" />
           Print Bill
        </Button>
        <Button onClick={onReset} className="bg-teal-600 hover:bg-teal-700">
          New Sale
        </Button>
      </div>
    </div>
  );
}
