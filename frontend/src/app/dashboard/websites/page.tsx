'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { Globe, ArrowRight } from 'lucide-react';
import { getDueDateLabel, getUrgencyColor } from '@/lib/utils';
import Link from 'next/link';

export default function CustomerWebsites() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWebsites().then(setWebsites).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="My Websites" description="Overview of your websites and services" />

        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : websites.length === 0 ? (
          <EmptyState icon={<Globe className="w-8 h-8 text-muted" />} title="No websites" description="No websites have been assigned to your account." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {websites.map((w: any) => {
              const due = w.hosting?.dueDate ? getDueDateLabel(w.hosting.dueDate) : null;
              return (
                <Link key={w.id} href={`/dashboard/websites/${w.id}`}>
                  <Card hover>
                    <CardContent>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-overlay flex items-center justify-center text-sm font-semibold text-muted">{w.name.charAt(0)}</div>
                          <div>
                            <p className="text-sm font-medium">{w.name}</p>
                            <p className="text-xs text-muted">{w.domain}</p>
                          </div>
                        </div>
                        <StatusBadge status={w.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                        <span className="text-xs text-muted">{w.plan?.name || 'No plan'}</span>
                        {due && <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
