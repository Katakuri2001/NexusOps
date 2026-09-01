'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { Bell, CheckCheck } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, string> = { BILLING: '💰', MAINTENANCE: '🔧', WARNING: '⚠️', INFORMATION: 'ℹ️', SYSTEM: '⚙️' };
const priorityBadge: Record<string, string> = {
  URGENT: 'bg-danger-subtle text-danger',
  IMPORTANT: 'bg-warning-subtle text-warning',
  NORMAL: 'bg-overlay text-muted',
};

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getNotifications().then(setNotifications).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const markRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAll = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader
          title="Notifications"
          description={`${unread} unread notification${unread !== 1 ? 's' : ''}`}
          action={unread > 0 ? (
            <button onClick={markAll} className="flex items-center gap-1.5 px-3 h-8 bg-elevated border border-border rounded-lg text-xs font-medium hover:bg-overlay transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          ) : undefined}
        />

        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : notifications.length === 0 ? (
          <EmptyState icon={<Bell className="w-8 h-8 text-muted" />} title="No notifications" description="Notifications will appear here." />
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => markRead(n.id)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  n.isRead ? "border-border bg-elevated hover:border-border-hover" : "border-primary/20 bg-primary-subtle/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">{typeIcons[n.type] || '📌'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium">{n.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityBadge[n.priority]}`}>{n.priority}</span>
                    </div>
                    <p className="text-sm text-muted mt-1">{n.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted">{formatRelativeTime(n.createdAt)}</span>
                      {n.website && <span className="text-xs text-muted">· {n.website.name}</span>}
                      {n.customer && <span className="text-xs text-muted">· {n.customer.user.name}</span>}
                    </div>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
