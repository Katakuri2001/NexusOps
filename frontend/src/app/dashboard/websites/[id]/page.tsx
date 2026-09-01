'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Server, Database, HardDrive, Wrench, Clock, DollarSign } from 'lucide-react';
import { formatDate, formatCurrency, getDueDateLabel, getUrgencyColor, formatRelativeTime } from '@/lib/utils';

type Tab = 'overview' | 'services' | 'billing' | 'maintenance' | 'timeline';

export default function CustomerWebsiteDetail() {
  const params = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  useEffect(() => {
    Promise.all([
      api.getWebsite(params.id as string),
      api.getWebsiteFinancial(params.id as string),
    ]).then(([w, f]) => { setWebsite(w); setFinancial(f); })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <AppShell><div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div></AppShell>;
  if (!website) return <AppShell><div className="text-center py-32 text-sm text-muted">Website not found</div></AppShell>;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Globe },
    { id: 'services' as const, label: 'Services', icon: Server },
    { id: 'billing' as const, label: 'Billing', icon: DollarSign },
    { id: 'maintenance' as const, label: 'Maintenance', icon: Wrench },
    { id: 'timeline' as const, label: 'Timeline', icon: Clock },
  ];

  const statusMessage: Record<string, string> = {
    OPERATIONAL: 'Your website is currently running normally.',
    MAINTENANCE: 'Scheduled maintenance is currently in progress.',
    ATTENTION_REQUIRED: 'Your website requires attention. We are working on it.',
    OFFLINE: 'Your website is currently offline.',
    DEVELOPMENT: 'Your website is currently being developed.',
    SUSPENDED: 'Your website has been suspended.',
  };

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-overlay text-muted mt-0.5"><ArrowLeft className="w-5 h-5" /></button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{website.name}</h1>
              <StatusBadge status={website.status} />
            </div>
            <p className="text-sm text-muted mt-1">{website.domain}</p>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-primary-subtle text-primary' : 'text-muted hover:text-foreground hover:bg-overlay'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Website Status</CardTitle></CardHeader>
              <CardContent>
                <div className="p-4 rounded-xl bg-background border border-border">
                  <div className="flex items-center gap-3 mb-3">
                    <StatusBadge status={website.status} />
                  </div>
                  <p className="text-sm text-foreground-secondary">{statusMessage[website.status] || 'Status information unavailable.'}</p>
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Type', value: website.websiteType || '—' },
                    { label: 'Launch Date', value: website.launchDate ? formatDate(website.launchDate) : '—' },
                    { label: 'Last Updated', value: formatRelativeTime(website.updatedAt) },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted">{r.label}</span>
                      <span className="text-sm font-medium">{r.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {website.plan && (
              <Card>
                <CardHeader><CardTitle subtitle={website.plan.description}>{website.plan.name} Plan</CardTitle></CardHeader>
                <CardContent>
                  <div className="text-center p-4 bg-background rounded-xl border border-border mb-4">
                    <p className="text-2xl font-bold">{formatCurrency(website.plan.price)}</p>
                    <p className="text-xs text-muted mt-1">per {website.plan.billingCycle}</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Renewal', value: website.plan.renewalDate ? formatDate(website.plan.renewalDate) : '—' },
                      { label: 'Status', value: <StatusBadge status={website.plan.isActive ? 'ACTIVE' : 'INACTIVE'} size="sm" /> },
                    ].map(r => (
                      <div key={r.label} className="flex justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted">{r.label}</span>
                        <span className="text-sm font-medium">{typeof r.value === 'string' ? r.value : r.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {[
              { name: 'Hosting', data: website.hosting, provider: website.hosting?.provider, dueDate: website.hosting?.dueDate },
              { name: 'Database', data: website.database, provider: website.database?.provider, dueDate: website.database?.dueDate },
              { name: 'Server', data: website.server, provider: website.server?.provider, dueDate: website.server?.dueDate },
            ].filter(s => s.data).map((s) => {
              const due = s.dueDate ? getDueDateLabel(s.dueDate) : null;
              return (
                <Card key={s.name}>
                  <CardHeader><CardTitle subtitle={s.provider}>{s.name}</CardTitle><StatusBadge status={s.data.status} size="sm" /></CardHeader>
                  <CardContent>
                    {due && (
                      <div className="flex justify-between py-2">
                        <span className="text-sm text-muted">Next Due</span>
                        <span className={`text-sm font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {tab === 'billing' && financial && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Plan', value: financial.recurring.plan },
                    { label: 'Hosting', value: financial.recurring.hosting },
                    { label: 'Database', value: financial.recurring.database },
                    { label: 'Server', value: financial.recurring.server },
                  ].filter(i => i.value > 0).map(item => (
                    <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted">{item.label}</span>
                      <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 pt-1 font-semibold">
                    <span className="text-sm">Total</span>
                    <span className="text-primary">{formatCurrency(financial.monthlyTotal)}/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'maintenance' && (
          <Card>
            <CardHeader><CardTitle>Maintenance History</CardTitle></CardHeader>
            <CardContent padding={false}>
              {website.maintenance && website.maintenance.filter((m: any) => !m.isInternal).length > 0 ? (
                <div className="divide-y divide-border">
                  {website.maintenance.filter((m: any) => !m.isInternal).map((r: any) => (
                    <div key={r.id} className="px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium">{r.title}</h4>
                          <p className="text-xs text-muted mt-0.5">{formatDate(r.createdAt)}</p>
                        </div>
                        <StatusBadge status={r.status.toUpperCase()} size="sm" />
                      </div>
                      {(() => {
                        let items: string[] = [];
                        try {
                          items = Array.isArray(r.items) ? r.items : typeof r.items === 'string' ? JSON.parse(r.items) : [];
                        } catch {}
                        return items.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {items.map((item: string, i: number) => (
                              <span key={i} className="px-2 py-0.5 bg-success-subtle text-success rounded text-xs">✓ {item}</span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-5 py-8 text-center text-sm text-muted">No maintenance records</div>
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'timeline' && (
          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent>
              {website.timeline && website.timeline.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
                  <div className="space-y-5">
                    {website.timeline.map((e: any) => (
                      <div key={e.id} className="flex gap-4 relative">
                        <div className="w-6 h-6 rounded-full bg-elevated border-2 border-border flex items-center justify-center z-10 flex-shrink-0 mt-0.5">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-sm font-medium">{e.title}</p>
                          {e.description && <p className="text-xs text-muted mt-0.5">{e.description}</p>}
                          <p className="text-[10px] text-muted mt-1">{formatRelativeTime(e.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted">No timeline events</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
