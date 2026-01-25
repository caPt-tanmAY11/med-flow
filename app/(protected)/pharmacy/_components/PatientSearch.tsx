"use client";

import { useEffect, useState } from "react";
import { Check, ChevronsUpDown, Search, User } from "lucide-react";
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
import { searchPatients, PatientResult } from "../actions";
import { useDebounce } from "@/hooks/use-debounce"; 
// Assuming useDebounce exists or I'll implement a simple one inside.
// I'll implement simple debounce inside to be safe.

export function PatientSearch({ onSelect }: { onSelect: (patient: PatientResult) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState<PatientResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
        if (query.length >= 2) {
            setLoading(true);
            const results = await searchPatients(query);
            setPatients(results);
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
            <Search className="h-4 w-4 opacity-50" />
            {query || "Search patient by name..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Type patient name..." value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>}
            {!loading && patients.length === 0 && query.length >= 2 && (
                <CommandEmpty>No patient found.</CommandEmpty>
            )}
            <CommandGroup>
              {!loading && patients.map((patient) => (
                <CommandItem
                  key={patient.id}
                  value={patient.id}
                  onSelect={() => {
                    onSelect(patient);
                    setOpen(false);
                    setQuery(patient.name);
                  }}
                >
                  <div className="flex flex-col">
                      <span className="font-medium">{patient.name}</span>
                      <span className="text-xs text-muted-foreground">
                          {patient.gender}, {patient.age}y • {patient.activeEncounter ? `Active: ${patient.activeEncounter.type}` : "No Active Visit"}
                      </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      query === patient.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
