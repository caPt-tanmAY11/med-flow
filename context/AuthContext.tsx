"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { useSession, signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export type UserRole =
    | 'ADMIN'
    | 'DOCTOR'
    | 'NURSE'
    | 'FRONT_DESK'
    | 'LAB_PERSON'
    | 'PHARMACIST'
    | 'BILLING'
    | 'MANAGEMENT'
    | 'NURSING_ADMIN'
    | 'PATIENT'
    | 'TPA';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    image?: string | null;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const roleNames: Record<UserRole, string> = {
    ADMIN: 'Administrator',
    DOCTOR: 'Doctor',
    NURSE: 'Nurse',
    FRONT_DESK: 'Front Desk',
    LAB_PERSON: 'Lab Person',
    PHARMACIST: 'Pharmacist',
    BILLING: 'Billing & Insurance',
    MANAGEMENT: 'Management',
    NURSING_ADMIN: 'Nursing Admin',
    PATIENT: 'Patient',
    TPA: 'TPA',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const router = useRouter();
    const { data: session, isPending } = useSession();

    const user: User | null = session?.user ? {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: (session.user.role as UserRole) || 'PATIENT',
        image: session.user.image,
    } : null;

    const logout = async () => {
        await signOut();
        router.push('/auth');
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading: isPending,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
