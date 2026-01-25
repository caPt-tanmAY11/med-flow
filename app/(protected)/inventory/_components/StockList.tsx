"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StockItem } from "../actions";
import { StockActionDialog } from "./StockActionDialog";
import { format } from "date-fns";
import { useState, Fragment } from "react";
import { ChevronDown, ChevronRight, PackageOpen, History } from "lucide-react";
import { Button } from "@/components/ui/button";

export function StockList({ items }: { items: StockItem[] }) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Total Stock</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Next Expiry</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const nextExpiry = item.batches.length > 0 
                ? item.batches.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())[0].expiryDate 
                : null;

            return (
              <Fragment key={item.id}>
                <TableRow className="cursor-pointer hover:bg-muted/50">
                   <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleExpand(item.id)}>
                        {expandedItems.has(item.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.currentStock} {item.unit}</TableCell>
                  <TableCell>
                    <Badge variant={item.status === "OUT_OF_STOCK" ? "destructive" : item.status === "LOW_STOCK" ? "secondary" : "outline"}>
                        {item.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {nextExpiry ? format(new Date(nextExpiry), "MMM d, yyyy") : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                         <StockActionDialog item={item} action="issue" />
                         <StockActionDialog item={item} action="add" />
                    </div>
                  </TableCell>
                </TableRow>
                {expandedItems.has(item.id) && (
                    <TableRow className="bg-muted/30">
                        <TableCell colSpan={7} className="p-4">
                            <div className="rounded-md border bg-background p-4 mb-4">
                                <h4 className="mb-4 text-sm font-semibold flex items-center gap-2">
                                    <PackageOpen className="h-4 w-4" />
                                    Active Batches (FEFO Order)
                                </h4>
                                {item.batches.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No active batches.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Batch #</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>In Date</TableHead>
                                                <TableHead>Expiry</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {item.batches.map(batch => (
                                                <TableRow key={batch.id}>
                                                    <TableCell>{batch.batchNumber}</TableCell>
                                                    <TableCell>{batch.quantity}</TableCell>
                                                    <TableCell>{format(new Date(batch.createdAt), "MMM d, yyyy")}</TableCell>
                                                    <TableCell>{format(new Date(batch.expiryDate), "MMM d, yyyy")}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>

                            <div className="rounded-md border bg-background p-4">
                                <h4 className="mb-4 text-sm font-semibold flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Stock History (Recent Transactions)
                                </h4>
                                {item.transactions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No transaction history.</p>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Date & Time</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Batch #</TableHead>
                                                <TableHead>Notes</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {item.transactions.map(t => (
                                                <TableRow key={t.id}>
                                                    <TableCell>
                                                        <Badge variant={t.transactionType === "IN" ? "default" : "secondary"}>
                                                            {t.transactionType === "IN" ? "IN (Added)" : "OUT (Issued)"}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="flex flex-col">
                                                        <span className="font-medium">{format(new Date(t.performedAt), "MMM d, yyyy")}</span>
                                                        <span className="text-xs text-muted-foreground">{format(new Date(t.performedAt), "h:mm a")}</span>
                                                    </TableCell>
                                                    <TableCell>{t.quantity}</TableCell>
                                                    <TableCell>{t.batchNumber || "-"}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{t.notes || "-"}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </div>
                        </TableCell>
                    </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
