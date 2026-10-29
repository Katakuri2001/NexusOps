'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './sidebar';
import Header from './header';
import CommandPalette from '@/components/search/command-palette';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/store/auth-provider';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Globe, Users, Wrench, Bell, CreditCard,
  Activity, UserCircle,
} from 'lucide-react';

const bottomNavItems: Record<string, { href: string; label: string; icon: React.ElementType }[]> = {
  OWNER: [
    { href: '/admin', label: 'Home', icon: LayoutDashboard },
    { href: '/admin/websites', label: 'Sites', icon: Globe },
    { href: '/admin/customers', label: 'Clients', icon: Users },
    { href: '/admin/notifications', label: 'Alerts', icon: Bell },
    { href: '/admin/profile', label: 'Profile', icon: UserCircle },
  ],
  CUSTOMER: [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/dashboard/websites', label: 'Sites', icon: Globe },
    { href: '/dashboard/notifications', label: 'Alerts', icon: Bell },
    { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
    { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  ],
  TECHNICIAN: [
    { href: '/technician', label: 'Home', icon: LayoutDashboard },
    { href: '/technician/websites', label: 'Sites', icon: Globe },
    { href: '/technician/maintenance', label: 'Maint.', icon: Wrench },
    { href: '/technician/activity', label: 'Activity', icon: Activity },
    { href: '/technician/profile', label: 'Profile', icon: UserCircle },
  ],
};

function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();
  const role = user?.role || 'CUSTOMER';
  const items = bottomNavItems[role] || bottomNavItems.CUSTOMER;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border-glass">
      <div className="flex items-center justify-around h-16 px-2">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-w-[44px] transition-colors",
                active ? "text-primary" : "text-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSearchOpen={() => setSearchOpen(true)}
      />
      <div className="lg:ml-60 flex flex-col min-h-screen">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          onSearchOpen={() => setSearchOpen(true)}
        />
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={typeof window !== 'undefined' ? window.location.pathname : ''}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <MobileBottomNav />
    </div>
  );
}
