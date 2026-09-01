'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/store/auth-provider';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { Menu, Bell, Search, X, ChevronRight, LogOut } from 'lucide-react';
import Link from 'next/link';

export default function Header({ onMenuClick, onSearchOpen }: {
  onMenuClick: () => void;
  onSearchOpen: () => void;
}) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data.slice(0, 8));
    } catch {}
  };

  const handleNotificationOpen = () => {
    if (!showNotifications) fetchNotifications();
    setShowNotifications(!showNotifications);
    setShowUserMenu(false);
  };

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const notifHref = user?.role === 'OWNER' ? '/admin/notifications'
    : user?.role === 'TECHNICIAN' ? '/technician'
    : '/dashboard/notifications';

  const typeIcons: Record<string, string> = {
    BILLING: '💰', MAINTENANCE: '🔧', WARNING: '⚠️', INFORMATION: 'ℹ️', SYSTEM: '⚙️',
  };

  return (
    <header className="sticky top-0 z-30 h-14 glass-strong border-b border-border flex items-center px-4 lg:px-6 gap-3">
      <button onClick={onMenuClick} className="lg:hidden p-1.5 rounded-lg hover:bg-overlay text-muted">
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Search */}
        <button
          onClick={onSearchOpen}
          className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg border border-border hover:border-border-hover text-muted text-xs transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="text-muted">Search</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={handleNotificationOpen}
            className="relative p-2 rounded-lg hover:bg-overlay text-muted transition-colors"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-elevated border border-border rounded-xl shadow-2xl animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:text-primary-hover">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted text-center py-8">No notifications</p>
                ) : (
                  notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={cn(
                        "px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-overlay transition-colors",
                        !n.isRead && "bg-primary-subtle/30"
                      )}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="text-sm mt-0.5">{typeIcons[n.type] || '📌'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{n.title}</p>
                          <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{n.message}</p>
                          {n.website && <p className="text-[10px] text-muted mt-1">{n.website.name}</p>}
                        </div>
                        {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Link
                href={notifHref}
                onClick={() => setShowNotifications(false)}
                className="flex items-center justify-center gap-1 px-4 py-2.5 text-xs font-medium text-primary hover:bg-overlay transition-colors border-t border-border"
              >
                View all notifications <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-overlay transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-semibold">
              {user?.name?.charAt(0)}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-elevated border border-border rounded-xl shadow-2xl animate-fade-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-overlay transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
