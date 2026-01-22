"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getNavigationForRole, NavGroup } from '@/config/navigation';
import { cn } from '@/lib/utils';
import { Building2, ChevronDown, Sparkles } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const Sidebar: React.FC = () => {
    const { user } = useAuth();
    const pathname = usePathname();

    if (!user) return null;

    const navigation = getNavigationForRole(user.role);

    return (
        <aside className="w-72 bg-sidebar text-sidebar-foreground flex flex-col h-screen sticky top-0">
            {/* Logo Section */}
            <div className="p-5 border-b border-sidebar-border/50">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shadow-lg shadow-sidebar-primary/25">
                        <Building2 className="w-6 h-6 text-sidebar-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="font-serif font-bold text-lg tracking-tight">MedFlow</h1>
                        <p className="text-xs text-sidebar-foreground/60">Hospital System</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                {navigation.map((group) => (
                    <NavGroupComponent key={group.title} group={group} currentPath={pathname} />
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-sidebar-border/50">
                <div className="floating-card bg-sidebar-accent/50 p-4 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-5 h-5 text-sidebar-primary" />
                        <span className="text-sm font-medium">Quick Actions</span>
                    </div>
                    <p className="text-xs text-sidebar-foreground/70">
                        Press <kbd className="px-1.5 py-0.5 bg-sidebar-accent rounded text-[10px]">⌘K</kbd> for quick search
                    </p>
                </div>
                <p className="text-[10px] text-sidebar-foreground/40 mt-4 text-center">
                    v1.0.0 • Demo Mode
                </p>
            </div>
        </aside>
    );
};

const NavGroupComponent: React.FC<{ group: NavGroup; currentPath: string }> = ({ group, currentPath }) => {
    const hasActiveItem = group.items.some((item) => currentPath === item.href);
    const [isOpen, setIsOpen] = React.useState(hasActiveItem || group.items.length <= 3);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-1">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-[11px] font-semibold text-sidebar-foreground/50 uppercase tracking-widest hover:text-sidebar-foreground/70 transition-colors">
                {group.title}
                <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-200", isOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-0.5">
                {group.items.map((item) => {
                    const isActive = currentPath === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "nav-item group",
                                isActive && "nav-item-active"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                            )} />
                            <span className="flex-1 font-medium">{item.title}</span>
                            {item.badge && (
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full text-[10px] font-bold min-w-[20px] text-center",
                                    item.badgeType === 'critical' && "bg-status-critical text-status-critical-foreground animate-pulse",
                                    item.badgeType === 'warning' && "bg-status-warning text-status-warning-foreground",
                                    item.badgeType === 'info' && "bg-status-info text-status-info-foreground"
                                )}>
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </CollapsibleContent>
        </Collapsible>
    );
};

export default Sidebar;
