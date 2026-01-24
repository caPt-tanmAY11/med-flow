"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth, roleNames } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, User, Search, Settings, ChevronDown, Check, Trash2, X } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link: string | null;
    isRead: boolean;
    createdAt: string;
}

const Navbar: React.FC = () => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const response = await fetch(`/api/notifications?userId=${user.id}&limit=10`);
            const result = await response.json();
            setNotifications(result.data || []);
            setUnreadCount(result.unreadCount || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }, [user]);

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/${notificationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isRead: true }),
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: user.id }),
            });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours}h ago`;
        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays}d ago`;
    };

    const getTypeStyles = (type: string) => {
        switch (type) {
            case 'critical': return 'border-l-status-critical bg-status-critical/5';
            case 'warning': return 'border-l-status-warning bg-status-warning/5';
            case 'success': return 'border-l-status-success bg-status-success/5';
            default: return 'border-l-status-info bg-status-info/5';
        }
    };

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
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="relative rounded-full w-10 h-10 hover:bg-accent"
                        >
                            <Bell className="w-5 h-5 text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-status-critical text-status-critical-foreground rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 p-0 rounded-xl max-h-[400px] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                            <h3 className="font-semibold">Notifications</h3>
                            {unreadCount > 0 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7 px-2"
                                    onClick={markAllAsRead}
                                >
                                    <Check className="w-3 h-3 mr-1" />
                                    Mark all read
                                </Button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                    <Bell className="w-8 h-8 mb-2 opacity-50" />
                                    <p className="text-sm">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => handleNotificationClick(notification)}
                                        className={cn(
                                            "px-4 py-3 border-b border-l-4 cursor-pointer hover:bg-muted/50 transition-colors",
                                            getTypeStyles(notification.type),
                                            !notification.isRead && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className={cn(
                                                    "text-sm truncate",
                                                    !notification.isRead && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-muted-foreground/70 mt-1">
                                                    {getTimeAgo(notification.createdAt)}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

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
