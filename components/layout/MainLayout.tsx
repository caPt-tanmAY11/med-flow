"use client";

import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
    children: React.ReactNode;
}

function MainLayout({ children }: MainLayoutProps) {
    return (
        <div className="flex min-h-screen bg-neutral-50 text-neutral-900">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Navbar />
                <main className="flex-1 p-6 lg:p-8 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
