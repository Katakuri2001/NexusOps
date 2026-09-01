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
import { Globe, CheckCircle, AlertTriangle, Wrench, ArrowRight } from 'lucide-react';
import { getDueDateLabel, getUrgencyColor } from '@/lib/utils';
import Link from 'next/link';

export default function TechnicianDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && user.role !== 'TECHNICIAN') {
      router.push(user.role === 'OWNER' ? '/admin' : '/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const w = await api.getWebsites();
        setWebsites(w);
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

  const operational = websites.filter(w => w.status === 'OPERATIONAL').length;
  const attention = websites.filter(w => w.status === 'ATTENTION_REQUIRED' || w.status === 'OFFLINE').length;
  const maintenance = websites.filter(w => w.status === 'MAINTENANCE').length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="text-sm text-muted mt-1">
            {websites.length === 0
              ? "No websites are currently assigned to you."
              : `You have ${websites.length} assigned website${websites.length > 1 ? 's' : ''}.`
            }
          </p>
        </div>

        <StaggerList className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Assigned" value={websites.length} icon={<Globe className="w-5 h-5" />} />
          <StatCard label="Operational" value={operational} icon={<CheckCircle className="w-5 h-5" />} />
          <StatCard label="Needs Attention" value={attention + maintenance} icon={<AlertTriangle className="w-5 h-5" />} />
        </StaggerList>

        <Card>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="text-sm font-semibold">My Assigned Websites</h3>
            <Link href="/technician/websites" className="text-xs text-primary hover:text-primary-hover flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <CardContent padding={false}>
            {websites.length === 0 ? (
              <EmptyState
                icon={<Globe className="w-8 h-8 text-muted" />}
                title="No websites assigned"
                description="Websites assigned to you will appear here."
              />
            ) : (
              <div className="divide-y divide-border">
                {websites.map((w: any) => {
                  const due = w.hosting?.dueDate ? getDueDateLabel(w.hosting.dueDate) : null;
                  return (
                    <Link
                      key={w.id}
                      href={`/technician/websites/${w.id}`}
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
                        <p className="text-xs text-muted mt-0.5">{w.domain} · {w.customer?.user?.name || w.customer?.name || '—'}</p>
                      </div>
                      {due && <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>}
                      <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
