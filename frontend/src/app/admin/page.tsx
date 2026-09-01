'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { StaggerList, StaggerItem } from '@/components/motion';
import { StatCard, Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { StatCardSkeleton, CardSkeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { useAuth } from '@/store/auth-provider';
import { useRouter } from 'next/navigation';
import { Globe, Users, AlertTriangle, Clock, ArrowRight, Activity, Wrench, Bell } from 'lucide-react';
import { formatRelativeTime, getDueDateLabel, getUrgencyColor } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [websites, setWebsites] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'OWNER') {
      router.push(user.role === 'TECHNICIAN' ? '/technician' : '/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, w, a] = await Promise.all([
          api.getDashboardStats(),
          api.getWebsites(),
          api.getActivityLogs().catch(() => []),
        ]);
        setStats(s);
        setWebsites(w);
        setActivity(a.slice(0, 6));
      } catch {} finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const attentionWebsites = websites.filter(w =>
    w.status === 'ATTENTION_REQUIRED' || w.status === 'OFFLINE' || w.status === 'SUSPENDED'
  );

  const upcomingDue = websites
    .filter(w => w.hosting?.dueDate)
    .map(w => ({ ...w, due: getDueDateLabel(w.hosting.dueDate) }))
    .sort((a, b) => {
      const order: Record<string, number> = { overdue: 0, soon: 1, upcoming: 2, good: 3 };
      return (order[a.due.urgency] ?? 4) - (order[b.due.urgency] ?? 4);
    })
    .slice(0, 5);

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
          <div className="space-y-2"><div className="skeleton h-7 w-48" /><div className="skeleton h-4 w-72" /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2"><CardSkeleton rows={4} /></div>
            <CardSkeleton rows={3} />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-muted mt-1">Here&apos;s what&apos;s happening with your websites.</p>
        </div>

        {/* Stats */}
        <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Websites" value={stats?.totalWebsites || 0} icon={<Globe className="w-5 h-5" />} />
          <StatCard label="Customers" value={stats?.activeCustomers || 0} icon={<Users className="w-5 h-5" />} />
          <StatCard label="Attention" value={stats?.attentionWebsites || 0} icon={<AlertTriangle className="w-5 h-5" />} change={stats?.attentionWebsites > 0 ? { value: 'Needs review', type: 'down' } : undefined} />
          <StatCard label="Due Soon" value={stats?.upcomingDueDates || 0} icon={<Clock className="w-5 h-5" />} />
        </StaggerList>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Attention Required */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle subtitle={attentionWebsites.length === 0 ? 'All systems healthy' : `${attentionWebsites.length} websites need attention`}>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-warning-subtle"><AlertTriangle className="w-3.5 h-3.5 text-warning" /></div>
                  Requires Attention
                </div>
              </CardTitle>
              <Link href="/admin/websites" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent padding={false}>
              {attentionWebsites.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="w-10 h-10 rounded-full bg-success-subtle flex items-center justify-center mx-auto mb-3">
                    <Activity className="w-5 h-5 text-success" />
                  </div>
                  <p className="text-sm font-medium">All systems healthy</p>
                  <p className="text-xs text-muted mt-1">No websites require attention right now</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {attentionWebsites.map((w: any) => (
                    <Link
                      key={w.id}
                      href={`/admin/websites/${w.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-overlay transition-colors"
                    >
                      <div className="w-9 h-9 rounded-lg bg-overlay flex items-center justify-center text-xs font-semibold text-muted flex-shrink-0">
                        {w.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{w.domain}</p>
                          <StatusBadge status={w.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted mt-0.5">{w.customer?.user?.name || 'No customer'}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Due Dates */}
          <Card>
            <CardHeader>
              <CardTitle subtitle="Next 30 days">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-info-subtle"><Clock className="w-3.5 h-3.5 text-info" /></div>
                  Upcoming
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent padding={false}>
              {upcomingDue.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted">No upcoming due dates</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {upcomingDue.map((w: any) => (
                    <Link
                      key={w.id}
                      href={`/admin/websites/${w.id}`}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-overlay transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{w.domain}</p>
                        <p className="text-xs text-muted">{w.hosting?.provider}</p>
                      </div>
                      <span className={`text-xs font-medium ${getUrgencyColor(w.due.urgency)}`}>
                        {w.due.label}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity + Websites Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Website Overview</CardTitle>
              <Link href="/admin/websites" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent padding={false}>
              <div className="divide-y divide-border">
                {websites.slice(0, 5).map((w: any) => (
                  <Link
                    key={w.id}
                    href={`/admin/websites/${w.id}`}
                    className="flex items-center gap-4 px-5 py-3 hover:bg-overlay transition-colors"
                  >
                    <div className="w-9 h-9 rounded-lg bg-overlay flex items-center justify-center text-xs font-semibold text-muted flex-shrink-0">
                      {w.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{w.name}</p>
                      <p className="text-xs text-muted">{w.domain}</p>
                    </div>
                    <StatusBadge status={w.status} size="sm" />
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <Link href="/admin/activity" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent padding={false}>
              {activity.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-sm text-muted">No recent activity</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {activity.map((log: any) => (
                    <div key={log.id} className="px-5 py-3">
                      <p className="text-xs">
                        <span className="font-medium">{log.user?.name || 'System'}</span>
                        <span className="text-muted"> {log.action.toLowerCase().replace(/_/g, ' ')}</span>
                      </p>
                      <p className="text-[10px] text-muted mt-0.5">{formatRelativeTime(log.createdAt)}</p>
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
