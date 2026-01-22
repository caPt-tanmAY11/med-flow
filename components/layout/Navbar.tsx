"use client";

import React from 'react';
import { useAuth, roleNames } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, User, Search, Settings, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const router = useRouter();

    if (!user) return null;

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    return (
        <header className="h-16 bg-card/80 backdrop-blur-md border-b border-border/50 flex items-center justify-between px-6 sticky top-0 z-40">
            {/* Left Section */}
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="font-serif text-lg font-semibold text-foreground">
                        Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}
                    </h2>
                    <p className="text-xs text-muted-foreground">{today}</p>
                </div>
            </div>

            {/* Center - Search */}
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search patients, records, or modules..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-full bg-muted/50 border-0 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative rounded-full w-10 h-10 hover:bg-accent"
                >
                    <Bell className="w-5 h-5 text-muted-foreground" />
                    <span className="absolute top-1 right-1 w-5 h-5 bg-status-critical text-status-critical-foreground rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                        3
                    </span>
                </Button>

                {/* Settings */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full w-10 h-10 hover:bg-accent hidden md:flex"
                >
                    <Settings className="w-5 h-5 text-muted-foreground" />
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="flex items-center gap-3 pl-2 pr-3 py-2 rounded-full hover:bg-accent h-auto"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground font-semibold text-sm shadow-md shadow-primary/20">
                                {user.name.charAt(0)}
                            </div>
                            <div className="text-left hidden md:block">
                                <p className="text-sm font-medium text-foreground leading-tight">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{roleNames[user.role]}</p>
                            </div>
                            <ChevronDown className="w-4 h-4 text-muted-foreground hidden md:block" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                        <div className="px-3 py-2 mb-2">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{roleNames[user.role]}</p>
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-lg cursor-pointer">
                            <User className="w-4 h-4 mr-3" />
                            My Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-lg cursor-pointer">
                            <Settings className="w-4 h-4 mr-3" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="rounded-lg cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                        >
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
};

export default Navbar;
