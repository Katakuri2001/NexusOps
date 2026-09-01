'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth-provider';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import {
  LayoutDashboard, Globe, Users, Wrench, Bell, CreditCard,
  Activity, Shield, FileText, User, Search, LogOut, ChevronDown,
  Menu, X, Settings, Command, UserCircle,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const navGroups: Record<string, { label: string; items: NavItem[] }[]> = {
  OWNER: [
    {
      label: 'Overview',
      items: [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Management',
      items: [
        { href: '/admin/websites', label: 'Websites', icon: Globe },
        { href: '/admin/customers', label: 'Customers', icon: Users },
        { href: '/admin/technicians', label: 'Technicians', icon: Wrench },
      ],
    },
    {
      label: 'Operations',
      items: [
        { href: '/admin/billing', label: 'Billing', icon: CreditCard },
        { href: '/admin/notifications', label: 'Notifications', icon: Bell },
        { href: '/admin/activity', label: 'Activity', icon: Activity },
        { href: '/admin/profile', label: 'Profile', icon: UserCircle },
      ],
    },
  ],
  CUSTOMER: [
    {
      label: 'Overview',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Portal',
      items: [
        { href: '/dashboard/websites', label: 'My Websites', icon: Globe },
        { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
        { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
        { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
      ],
    },
  ],
  TECHNICIAN: [
    {
      label: 'Overview',
      items: [
        { href: '/technician', label: 'Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Work',
      items: [
        { href: '/technician/websites', label: 'Websites', icon: Globe },
        { href: '/technician/maintenance', label: 'Maintenance', icon: FileText },
        { href: '/technician/activity', label: 'Activity', icon: Activity },
        { href: '/technician/profile', label: 'Profile', icon: UserCircle },
      ],
    },
  ],
};

const roleLabels: Record<string, string> = {
  OWNER: 'Admin',
  CUSTOMER: 'Client',
  TECHNICIAN: 'Technician',
};

export default function Sidebar({ open, onClose, onSearchOpen }: {
  open: boolean;
  onClose: () => void;
  onSearchOpen: () => void;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const data = await api.getUnreadCount();
        setUnreadCount(data.count);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const role = user?.role || 'CUSTOMER';
  const groups = navGroups[role] || navGroups.CUSTOMER;

  const isActive = (href: string) => {
    if (href === '/admin' || href === '/dashboard' || href === '/technician') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-60 bg-surface border-r border-border flex flex-col",
        "lg:translate-x-0 transition-transform duration-200 ease-out",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-border flex-shrink-0">
          <Link href={role === 'OWNER' ? '/admin' : role === 'TECHNICIAN' ? '/technician' : '/dashboard'} className="flex items-center gap-2.5" onClick={onClose}>
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-xs">N</span>
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight">NexusOps</span>
            </div>
          </Link>
          <button onClick={onClose} className="lg:hidden p-1 rounded hover:bg-overlay text-muted">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search trigger */}
        <div className="px-3 pt-3 flex-shrink-0">
          <button
            onClick={onSearchOpen}
            className="w-full flex items-center gap-2 px-3 h-8 bg-elevated border border-border rounded-lg text-xs text-muted hover:border-border-hover transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-overlay rounded text-[10px] font-mono border border-border">
              <Command className="w-2.5 h-2.5" />K
            </kbd>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                        active
                          ? "bg-primary-subtle text-primary"
                          : "text-foreground-secondary hover:text-foreground hover:bg-overlay"
                      )}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.label === 'Notifications' && unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] text-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User */}
        <div className="flex-shrink-0 border-t border-border p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
              {user?.name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-[10px] text-muted truncate">{roleLabels[role]}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-md hover:bg-overlay text-muted hover:text-danger transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
