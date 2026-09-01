'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { formatCurrency, formatDate, getDueDateLabel, getUrgencyColor } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

export default function AdminBilling() {
  const [charges, setCharges] = useState<any[]>([]);
  const [dueDates, setDueDates] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getUpcomingCharges(), api.getDueDates()])
      .then(([c, d]) => { setCharges(c); setDueDates(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppShell><div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="Billing" description="Upcoming charges and due dates" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Upcoming Charges</h3>
              <p className="text-xs text-muted mt-0.5">Pending within 30 days</p>
            </div>
            <div className="divide-y divide-border">
              {charges.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-muted">No upcoming charges</div>
              ) : charges.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.description}</p>
                    <p className="text-xs text-muted">{c.website?.name} · {formatDate(c.date)}</p>
                  </div>
                  <span className="text-sm font-bold">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="px-5 py-4 border-b border-border">
              <h3 className="text-sm font-semibold">Due Dates</h3>
              <p className="text-xs text-muted mt-0.5">Services due within 30 days</p>
            </div>
            <div className="divide-y divide-border">
              {!dueDates || (!dueDates.hostings?.length && !dueDates.databases?.length && !dueDates.servers?.length) ? (
                <div className="px-5 py-8 text-center text-sm text-muted">No upcoming due dates</div>
              ) : (
                <>
                  {dueDates.hostings?.map((h: any) => {
                    const due = getDueDateLabel(h.dueDate);
                    return (
                      <div key={h.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">{h.website?.name}</p>
                          <p className="text-xs text-muted">Hosting · {h.provider}</p>
                        </div>
                        <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>
                      </div>
                    );
                  })}
                  {dueDates.databases?.map((d: any) => {
                    const due = getDueDateLabel(d.dueDate);
                    return (
                      <div key={d.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">{d.website?.name}</p>
                          <p className="text-xs text-muted">Database · {d.provider}</p>
                        </div>
                        <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>
                      </div>
                    );
                  })}
                  {dueDates.servers?.map((s: any) => {
                    const due = getDueDateLabel(s.dueDate);
                    return (
                      <div key={s.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium">{s.website?.name}</p>
                          <p className="text-xs text-muted">Server · {s.provider}</p>
                        </div>
                        <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
