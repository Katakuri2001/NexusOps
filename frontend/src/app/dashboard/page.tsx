'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { StaggerList } from '@/components/motion';
import { StatCard, Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { StatCardSkeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { useAuth } from '@/store/auth-provider';
import { useRouter } from 'next/navigation';
import { Globe, CheckCircle, AlertTriangle, Bell, ArrowRight } from 'lucide-react';
import { formatRelativeTime, getDueDateLabel, getUrgencyColor } from '@/lib/utils';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [websites, setWebsites] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'CUSTOMER') {
      router.push(user.role === 'OWNER' ? '/admin' : '/technician');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [w, n] = await Promise.all([api.getWebsites(), api.getNotifications()]);
        setWebsites(w);
        setNotifications(n);
      } catch {} finally { setLoading(false); }
    };
    if (user) fetchData();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (authLoading || loading) {
    return (
      <AppShell>
        <div className="space-y-6 animate-fade-in">
          <div className="skeleton h-7 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        </div>
      </AppShell>
    );
  }

  const active = websites.filter(w => w.status === 'OPERATIONAL').length;
  const attention = websites.filter(w => w.status === 'ATTENTION_REQUIRED' || w.status === 'OFFLINE').length;
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-muted mt-1">
            {attention === 0
              ? "Your websites are running normally."
              : `${attention} website${attention > 1 ? 's' : ''} need attention.`
            }
          </p>
        </div>

        <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="My Websites" value={websites.length} icon={<Globe className="w-5 h-5" />} />
          <StatCard label="Active" value={active} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Attention" value={attention} icon={<AlertTriangle className="w-5 h-5" />} />
        </StaggerList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Your Websites</h3>
              <Link href="/dashboard/websites" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <CardContent padding={false}>
              {websites.length === 0 ? (
                <EmptyState
                  icon={<Globe className="w-8 h-8 text-muted" />}
                  title="No websites"
                  description="No websites have been assigned to your account."
                />
              ) : (
                <div className="divide-y divide-border">
                  {websites.map((w: any) => {
                    const due = w.hosting?.dueDate ? getDueDateLabel(w.hosting.dueDate) : null;
                    return (
                      <Link
                        key={w.id}
                        href={`/dashboard/websites/${w.id}`}
                        className="flex items-center gap-4 px-5 py-4 hover:bg-overlay transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-overlay flex items-center justify-center text-sm font-semibold text-muted flex-shrink-0">
                          {w.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{w.name}</p>
                            <StatusBadge status={w.status} size="sm" />
                          </div>
                          <p className="text-xs text-muted mt-0.5">{w.domain}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium">{w.plan?.name || '—'}</p>
                          {due && <p className={`text-[10px] font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</p>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <Link href="/dashboard/notifications" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <CardContent padding={false}>
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.slice(0, 5).map((n: any) => (
                    <div key={n.id} className={`px-5 py-3 ${!n.isRead ? 'bg-primary-subtle/20' : ''}`}>
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="text-[11px] text-muted mt-0.5 line-clamp-1">{n.message}</p>
                      <p className="text-[10px] text-muted mt-1">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
