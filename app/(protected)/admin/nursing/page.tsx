"use client";

import { useEffect, useState } from 'react';
import { Users, Key, Shield, UserPlus, Search, RefreshCw, CheckCircle, AlertCircle, Loader2, Calendar, X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Nurse {
    id: string;
    name: string;
    email: string;
    role: string;
    currentDuty: {
        id: string;
        shiftType: string;
        secretCode: string | null;
        ward: string | null;
    } | null;
}

export default function AdminNursingPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [nurses, setNurses] = useState<Nurse[]>([]);
    const [generating, setGenerating] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Add Nurse Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newNurseName, setNewNurseName] = useState('');
    const [addingNurse, setAddingNurse] = useState(false);

    // Code Success Modal
    const [createdNurseCode, setCreatedNurseCode] = useState<{ name: string, code: string } | null>(null);

    const fetchNurses = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/nurses');
            const result = await res.json();
            if (res.ok) {
                setNurses(result.data || []);
            } else {
                toast({ title: 'Error', description: 'Failed to load nurses', variant: 'destructive' });
            }
        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNurses();
    }, []);

    // Generate/Refresh Code
    const handleGenerateCode = async (nurse: Nurse) => {
        setGenerating(nurse.id);
        try {
            const res = await fetch('/api/nursing?action=generate-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nurseId: nurse.id, nurseName: nurse.name }),
            });
            const result = await res.json();
            if (res.ok) {
                toast({
                    title: 'Code Generated',
                    description: `New code for ${nurse.name}: ${result.data.code}`,
                });
                fetchNurses();
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to generate code', variant: 'destructive' });
        } finally {
            setGenerating(null);
        }
    };

    // Add Nurse Logic
    const handleAddNurse = async () => {
        if (!newNurseName.trim()) {
            toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
            return;
        }

        setAddingNurse(true);
        try {
            const res = await fetch('/api/admin/nurses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newNurseName }),
            });
            const result = await res.json();

            if (res.ok && result.secretCode) {
                setCreatedNurseCode({ name: newNurseName, code: result.secretCode });
                setShowAddModal(false);
                setNewNurseName('');
                fetchNurses();
            } else {
                toast({ title: 'Error', description: result.error || 'Failed to add nurse', variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' });
        } finally {
            setAddingNurse(false);
        }
    };

    const filteredNurses = nurses.filter(n =>
        n.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6 animate-fade-in relative">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Shield className="w-6 h-6 text-primary" />
                        Nursing Administration
                    </h1>
                    <p className="text-muted-foreground">Manage nurse access and daily codes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={fetchNurses} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                    <Button className="gap-2" onClick={() => setShowAddModal(true)}>
                        <UserPlus className="w-4 h-4" /> Register Nurse
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-4 bg-background p-4 rounded-xl border shadow-sm">
                <Search className="w-5 h-5 text-muted-foreground" />
                <Input
                    placeholder="Search nurses..."
                    className="border-none shadow-none focus-visible:ring-0 px-0"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredNurses.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No nurses found. Register a new nurse to get started.
                    </div>
                ) : (
                    filteredNurses.map(nurse => (
                        <Card key={nurse.id} className="overflow-hidden hover:shadow-md transition-shadow">
                            <CardHeader className="bg-muted/30 pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {nurse.name.charAt(0)}
                                        </div>
                                        <div>
                                            <CardTitle className="text-base">{nurse.name}</CardTitle>
                                            <CardDescription className="text-xs">{nurse.role}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant={nurse.currentDuty ? "default" : "secondary"}>
                                        {nurse.currentDuty ? "On Duty" : "Off Duty"}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <Key className="w-4 h-4" /> Active Code
                                    </span>
                                    {nurse.currentDuty?.secretCode ? (
                                        <span className="font-mono font-bold tracking-widest bg-muted px-2 py-1 rounded">
                                            {nurse.currentDuty.secretCode}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground italic">Not Generated</span>
                                    )}
                                </div>

                                <Button
                                    className="w-full mt-2"
                                    variant={nurse.currentDuty?.secretCode ? "outline" : "default"}
                                    onClick={() => handleGenerateCode(nurse)}
                                    disabled={generating === nurse.id}
                                >
                                    {generating === nurse.id && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                                    {nurse.currentDuty?.secretCode ? 'Regenerate Code' : 'Generate Daily Code'}
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Add Nurse Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Register New Nurse</DialogTitle>
                        <DialogDescription>
                            Create a new nurse profile. A daily secret code will be generated immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nurse Name</Label>
                            <Input
                                placeholder="Enter full name"
                                value={newNurseName}
                                onChange={(e) => setNewNurseName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddNurse()}
                            />
                        </div>
                        <Button className="w-full" onClick={handleAddNurse} disabled={addingNurse || !newNurseName.trim()}>
                            {addingNurse ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 'Create & Generate Code'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Success Code Modal */}
            <Dialog open={!!createdNurseCode} onOpenChange={(open) => !open && setCreatedNurseCode(null)}>
                <DialogContent className="sm:max-w-md text-center">
                    <DialogHeader>
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <DialogTitle>Nurse Added Successfully</DialogTitle>
                        <DialogDescription>
                            {createdNurseCode?.name} has been registered.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <p className="text-sm text-muted-foreground mb-2">Daily Secret Code</p>
                        <div className="text-4xl font-mono font-bold tracking-widest text-primary p-4 bg-muted/30 rounded-xl border border-dashed">
                            {createdNurseCode?.code}
                        </div>
                        <p className="text-xs text-muted-foreground mt-4">
                            Provide this code to the nurse for today's login.
                        </p>
                    </div>
                    <Button onClick={() => setCreatedNurseCode(null)} className="w-full">
                        Done
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
}
