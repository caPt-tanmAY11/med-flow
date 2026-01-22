"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole =
    | 'admin'
    | 'doctor'
    | 'nurse'
    | 'front_desk'
    | 'lab_technician'
    | 'pharmacist'
    | 'billing'
    | 'management';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    department?: string;
    avatar?: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (role: UserRole, name?: string) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const roleNames: Record<UserRole, string> = {
    admin: 'Administrator',
    doctor: 'Doctor',
    nurse: 'Nurse',
    front_desk: 'Front Desk',
    lab_technician: 'Lab Technician',
    pharmacist: 'Pharmacist',
    billing: 'Billing & Insurance',
    management: 'Management',
};

const AUTH_STORAGE_KEY = 'medflow_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error('Failed to load auth state:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const login = (role: UserRole, name?: string) => {
        const newUser: User = {
            id: `user-${Date.now()}`,
            name: name || roleNames[role],
            role,
            department: role === 'doctor' ? 'General Medicine' : undefined,
        };
        setUser(newUser);
        try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
        } catch (error) {
            console.error('Failed to save auth state:', error);
        }
    };

    const logout = () => {
        setUser(null);
        try {
            localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch (error) {
            console.error('Failed to clear auth state:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
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

export { roleNames };
