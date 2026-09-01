'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useAuth } from '@/store/auth-provider';
import { formatCurrency } from '@/lib/utils';

export default function CustomerBilling() {
  const { user } = useAuth();
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getWebsites().then(setWebsites).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <AppShell><div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div></AppShell>;

  const total = websites.reduce((s, w) => s + (w.plan?.price || 0) + (w.hosting?.cost || 0) + (w.database?.monthlyCost || 0) + (w.server?.cost || 0), 0);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted mt-1">Your services and billing overview</p>
        </div>

        <Card>
          <CardContent>
            <div className="text-center py-4">
              <p className="text-3xl font-bold text-primary">{formatCurrency(total)}</p>
              <p className="text-xs text-muted mt-1">per month across all websites</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {websites.map((w: any) => (
            <Card key={w.id}>
              <CardHeader><CardTitle subtitle={w.domain}>{w.name}</CardTitle><StatusBadge status={w.status} size="sm" /></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { label: 'Plan', value: w.plan?.price, name: w.plan?.name },
                    { label: 'Hosting', value: w.hosting?.cost, name: w.hosting?.provider },
                    { label: 'Database', value: w.database?.monthlyCost, name: w.database?.provider },
                    { label: 'Server', value: w.server?.cost, name: w.server?.provider },
                  ].filter(s => s.value).map(s => (
                    <div key={s.label} className="flex justify-between py-2 border-b border-border last:border-0">
                      <span className="text-sm text-muted">{s.label} ({s.name})</span>
                      <span className="text-sm font-medium">{formatCurrency(s.value!)}/mo</span>
                    </div>
                  ))}
                  <div className="flex justify-between py-2 pt-1 font-semibold">
                    <span className="text-sm">Website Total</span>
                    <span className="text-primary">
                      {formatCurrency((w.plan?.price || 0) + (w.hosting?.cost || 0) + (w.database?.monthlyCost || 0) + (w.server?.cost || 0))}/mo
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
