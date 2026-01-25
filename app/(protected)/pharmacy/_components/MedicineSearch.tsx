"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Pill, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { searchMedicines, MedicineResult } from "../actions";
import { Badge } from "@/components/ui/badge";

export function MedicineSearch({ onSelect }: { onSelect: (medicine: MedicineResult) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [medicines, setMedicines] = useState<MedicineResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
        if (query.length >= 2) {
            setLoading(true);
            const results = await searchMedicines(query);
            setMedicines(results);
            setLoading(false);
        }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12"
        >
          <div className="flex items-center gap-2">
            <Pill className="h-4 w-4 opacity-50" />
            <span className="text-muted-foreground">Add medicine to cart...</span>
          </div>
          <Plus className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search medicine..." value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>}
            {!loading && medicines.length === 0 && query.length >= 2 && (
                <CommandEmpty>No medicine found.</CommandEmpty>
            )}
            <CommandGroup>
              {!loading && medicines.map((med) => (
                <CommandItem
                  key={med.id}
                  value={med.id}
                  onSelect={() => {
                    onSelect(med);
                    setOpen(false);
                    setQuery("");
                  }}
                  disabled={med.currentStock <= 0}
                >
                  <div className="flex flex-col w-full">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{med.name}</span>
                        <span className="font-bold">₹{med.price}</span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-muted-foreground">
                              {med.unit}
                          </span>
                          {med.currentStock > 0 ? (
                               <Badge variant="outline" className="text-xs">{med.currentStock} in stock</Badge>
                          ) : (
                               <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                      </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
