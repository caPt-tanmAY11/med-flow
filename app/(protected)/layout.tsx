"use client";

import { useAuth } from "@/context/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const queryClient = new QueryClient();

function ProtectedContent({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push("/login");
        }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
                </div>
            </div>
        );
    }

    return <MainLayout>{children}</MainLayout>;
}

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <QueryClientProvider client={queryClient}>
            <TooltipProvider>
                <Toaster />
                <ProtectedContent>{children}</ProtectedContent>
            </TooltipProvider>
        </QueryClientProvider>
    );
}
