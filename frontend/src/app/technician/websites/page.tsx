'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { Globe, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function TechnicianWebsites() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWebsites().then(setWebsites).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="Assigned Websites" description="Websites you have access to" />

        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : websites.length === 0 ? (
          <EmptyState icon={<Globe className="w-8 h-8 text-muted" />} title="No websites assigned" description="Websites assigned to you will appear here." />
        ) : (
          <div className="space-y-3">
            {websites.map((w: any) => (
              <Link key={w.id} href={`/technician/websites/${w.id}`}>
                <Card hover>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-overlay flex items-center justify-center text-sm font-semibold text-muted flex-shrink-0">{w.name.charAt(0)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{w.name}</p>
                          <StatusBadge status={w.status} size="sm" />
                        </div>
                        <p className="text-xs text-muted mt-0.5">{w.domain} · {w.customer?.user?.name || w.customer?.name || '—'}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
