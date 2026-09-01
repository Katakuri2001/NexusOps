'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { PageSkeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Globe, Server, Database, HardDrive, DollarSign, Wrench, Clock, Plus, Pencil, Bell } from 'lucide-react';
import { formatDate, formatCurrency, getDueDateLabel, getUrgencyColor, formatRelativeTime } from '@/lib/utils';
import ServiceEditorDialog from '@/components/service-editor-dialog';
import AddChargeDialog from '@/components/add-charge-dialog';
import AddMaintenanceDialog from '@/components/add-maintenance-dialog';
import AddTimelineEventDialog from '@/components/add-timeline-event-dialog';
import SendNotificationDialog from '@/components/send-notification-dialog';

type Tab = 'overview' | 'services' | 'billing' | 'maintenance' | 'timeline' | 'notify';

export default function AdminWebsiteDetail() {
  const params = useParams();
  const router = useRouter();
  const [website, setWebsite] = useState<any>(null);
  const [financial, setFinancial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  // Dialogs
  const [serviceDialog, setServiceDialog] = useState<{ open: boolean; type: 'hosting' | 'database' | 'server'; data?: any }>({ open: false, type: 'hosting' });
  const [chargeDialog, setChargeDialog] = useState(false);
  const [maintenanceDialog, setMaintenanceDialog] = useState(false);
  const [timelineDialog, setTimelineDialog] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [w, f] = await Promise.all([
        api.getWebsite(params.id as string),
        api.getWebsiteFinancial(params.id as string),
      ]);
      setWebsite(w);
      setFinancial(f);
    } catch {} finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <AppShell><div className="animate-fade-in"><PageSkeleton /></div></AppShell>;
  if (!website) return <AppShell><div className="text-center py-32 text-muted">Website not found</div></AppShell>;

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'services', label: 'Services', icon: Server },
    { id: 'billing', label: 'Billing', icon: DollarSign },
    { id: 'maintenance', label: 'Maintenance', icon: Wrench },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'notify', label: 'Notify', icon: Bell },
  ];

  const services = [
    { name: 'Hosting', key: 'hosting' as const, data: website.hosting, icon: Server, provider: website.hosting?.provider, cost: website.hosting?.cost, dueDate: website.hosting?.dueDate },
    { name: 'Database', key: 'database' as const, data: website.database, icon: Database, provider: website.database?.provider, cost: website.database?.monthlyCost, dueDate: website.database?.dueDate },
    { name: 'Server', key: 'server' as const, data: website.server, icon: HardDrive, provider: website.server?.provider, cost: website.server?.cost, dueDate: website.server?.dueDate },
  ];

  const activeServices = services.filter(s => s.data);
  const emptyServices = services.filter(s => !s.data);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-overlay text-muted mt-0.5">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{website.name}</h1>
              <StatusBadge status={website.status} />
            </div>
            <p className="text-sm text-muted mt-1">{website.domain} · {website.customer?.user?.name || '—'}</p>
            {website.developerName && <p className="text-xs text-muted mt-0.5">Developer: {website.developerName}</p>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 -mx-4 px-4 lg:mx-0 lg:px-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${tab === t.id ? 'bg-primary-subtle text-primary' : 'text-muted hover:text-foreground hover:bg-overlay'}`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>Website Information</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Domain', value: website.domain },
                    { label: 'Developer', value: website.developerName || '—' },
                    { label: 'Type', value: website.websiteType || '—' },
                    { label: 'Status', value: <StatusBadge status={website.status} size="sm" /> },
                    { label: 'Launch Date', value: website.launchDate ? formatDate(website.launchDate) : '—' },
                    { label: 'Last Updated', value: formatRelativeTime(website.updatedAt) },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted">{row.label}</span>
                      <span className="text-sm font-medium">{typeof row.value === 'string' ? row.value : row.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Service Health</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Website', status: website.status },
                    ...activeServices.map(s => ({ label: s.name, status: s.data.status })),
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${['OPERATIONAL', 'ACTIVE', 'ONLINE'].includes(item.status) ? 'bg-success' : ['MAINTENANCE', 'PENDING', 'IN_PROGRESS'].includes(item.status) ? 'bg-warning' : 'bg-danger'}`} />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <StatusBadge status={item.status} size="sm" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {financial && (
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle subtitle="Current monthly charges">Financial Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: 'Plan', value: financial.recurring.plan },
                      { label: 'Hosting', value: financial.recurring.hosting },
                      { label: 'Database', value: financial.recurring.database },
                      { label: 'Server', value: financial.recurring.server },
                      { label: 'Other', value: financial.recurring.otherRecurring },
                    ].map((item) => (
                      <div key={item.label} className="text-center p-3 bg-background rounded-lg border border-border">
                        <p className="text-[10px] text-muted uppercase tracking-wider">{item.label}</p>
                        <p className="text-lg font-bold mt-1">{formatCurrency(item.value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-sm font-semibold">Monthly Total</span>
                    <span className="text-xl font-bold text-primary">{formatCurrency(financial.monthlyTotal)}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {tab === 'services' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {activeServices.map((s) => {
                const due = s.dueDate ? getDueDateLabel(s.dueDate) : null;
                return (
                  <Card key={s.name}>
                    <CardHeader>
                      <CardTitle subtitle={s.provider}>{s.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={s.data.status} size="sm" />
                        <button onClick={() => setServiceDialog({ open: true, type: s.key, data: s.data })} className="p-1 rounded hover:bg-overlay text-muted hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-border">
                          <span className="text-sm text-muted">Cost</span>
                          <span className="text-sm font-medium">{formatCurrency(s.cost || 0)}/mo</span>
                        </div>
                        {s.dueDate && (
                          <div className="flex justify-between py-2 border-b border-border">
                            <span className="text-sm text-muted">Next Due</span>
                            <div className="text-right">
                              <span className="text-sm font-medium">{formatDate(s.dueDate)}</span>
                              {due && <p className={`text-[10px] font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
              {emptyServices.map((s) => (
                <Card key={s.name} className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-8">
                    <div className="p-2 rounded-lg bg-overlay mb-3"><s.icon className="w-5 h-5 text-muted" /></div>
                    <p className="text-sm font-medium mb-1">{s.name}</p>
                    <p className="text-xs text-muted mb-3">Not configured</p>
                    <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setServiceDialog({ open: true, type: s.key })}>Add</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {tab === 'billing' && (
          <div className="space-y-4">
            {financial && (
              <Card>
                <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: 'Plan', value: financial.recurring.plan },
                      { label: 'Hosting', value: financial.recurring.hosting },
                      { label: 'Database', value: financial.recurring.database },
                      { label: 'Server', value: financial.recurring.server },
                      { label: 'Other Recurring', value: financial.recurring.otherRecurring },
                    ].filter(i => i.value > 0).map((item) => (
                      <div key={item.label} className="flex justify-between py-2 border-b border-border last:border-0">
                        <span className="text-sm text-muted">{item.label}</span>
                        <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 pt-1 font-semibold">
                      <span className="text-sm">Total</span>
                      <span className="text-sm text-primary">{formatCurrency(financial.monthlyTotal)}/mo</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Additional Charges</CardTitle>
                <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setChargeDialog(true)}>Add Charge</Button>
              </CardHeader>
              <CardContent padding={false}>
                {website.charges && website.charges.length > 0 ? (
                  <div className="divide-y divide-border">
                    {website.charges.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">{c.description}</p>
                          <p className="text-xs text-muted">{formatDate(c.date)} · {c.billingType.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold">{formatCurrency(c.amount)}</p>
                          <StatusBadge status={c.status.toUpperCase()} size="sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-8 text-center text-sm text-muted">No additional charges</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'maintenance' && (
          <Card>
            <CardHeader>
              <CardTitle>Maintenance History</CardTitle>
              <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setMaintenanceDialog(true)}>Add Record</Button>
            </CardHeader>
            <CardContent padding={false}>
              {website.maintenance && website.maintenance.length > 0 ? (
                <div className="divide-y divide-border">
                  {website.maintenance.map((r: any) => (
                    <div key={r.id} className="px-5 py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium">{r.title}</h4>
                          <p className="text-xs text-muted mt-0.5">{formatDate(r.createdAt)} · {r.createdBy?.name || 'System'}</p>
                        </div>
                        <StatusBadge status={r.status.toUpperCase()} size="sm" />
                      </div>
                      {r.description && <p className="text-sm text-muted mt-2">{r.description}</p>}
                      {(() => {
                        let items: string[] = [];
                        try { items = Array.isArray(r.items) ? r.items : typeof r.items === 'string' ? JSON.parse(r.items) : []; } catch {}
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
            <CardHeader>
              <CardTitle>Website Timeline</CardTitle>
              <Button size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setTimelineDialog(true)}>Add Event</Button>
            </CardHeader>
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

        {tab === 'notify' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle subtitle={`Send to ${website.customer?.user?.name || 'customer'}`}>Send Notification</CardTitle>
                <Button size="sm" icon={<Bell className="w-3.5 h-3.5" />} onClick={() => setNotificationDialog(true)}>Send Notification</Button>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted">Send a notification to the customer about this website. They will see it in their notifications panel.</p>
                <div className="mt-4 p-3 bg-background rounded-lg border border-border">
                  <p className="text-xs text-muted uppercase tracking-wider mb-1">Customer</p>
                  <p className="text-sm font-medium">{website.customer?.user?.name || '—'}</p>
                  <p className="text-xs text-muted">{website.customer?.user?.email || '—'}</p>
                </div>
              </CardContent>
            </Card>

            {website.notifications && website.notifications.length > 0 && (
              <Card>
                <CardHeader><CardTitle>Recent Notifications Sent</CardTitle></CardHeader>
                <CardContent padding={false}>
                  <div className="divide-y divide-border">
                    {website.notifications.map((n: any) => (
                      <div key={n.id} className="px-5 py-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted mt-0.5 line-clamp-1">{n.message}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${n.isRead ? 'bg-overlay text-muted' : 'bg-primary-subtle text-primary'}`}>
                            {n.isRead ? 'Read' : 'Unread'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted mt-1">{formatRelativeTime(n.createdAt)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ServiceEditorDialog open={serviceDialog.open} onClose={() => setServiceDialog({ open: false, type: 'hosting' })} websiteId={website.id} serviceType={serviceDialog.type} existingData={serviceDialog.data} onSaved={fetchData} />
      <AddChargeDialog open={chargeDialog} onClose={() => setChargeDialog(false)} websiteId={website.id} onCreated={fetchData} />
      <AddMaintenanceDialog open={maintenanceDialog} onClose={() => setMaintenanceDialog(false)} websiteId={website.id} onCreated={fetchData} />
      <AddTimelineEventDialog open={timelineDialog} onClose={() => setTimelineDialog(false)} websiteId={website.id} onCreated={fetchData} />
      <SendNotificationDialog open={notificationDialog} onClose={() => setNotificationDialog(false)} websiteId={website.id} customerId={website.customerId} websiteName={website.name} onSent={fetchData} />
    </AppShell>
  );
}
