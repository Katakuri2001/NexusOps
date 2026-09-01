'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/badge';
import { api } from '@/services/api';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export default function AdminCustomerDetail() {
  const params = useParams();
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getCustomer(params.id as string).then(setCustomer).catch(() => {}).finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <AppShell><div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div></AppShell>;
  if (!customer) return <AppShell><div className="text-center py-32 text-sm text-muted">Customer not found</div></AppShell>;

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-overlay text-muted"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight">{customer.user.name}</h1>
              <span className={`text-xs font-medium ${customer.user.isActive ? 'text-success' : 'text-danger'}`}>
                {customer.user.isActive ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="text-sm text-muted mt-1">{customer.user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Account Details</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: 'Email', value: customer.user.email },
                  { label: 'Phone', value: customer.phone || '—' },
                  { label: 'Company', value: customer.company || '—' },
                  { label: 'Address', value: customer.address || '—' },
                  { label: 'Joined', value: formatDate(customer.createdAt) },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted">{r.label}</span>
                    <span className="text-sm font-medium text-right max-w-[200px]">{r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle subtitle={`${customer.websites.length} websites`}>Websites</CardTitle></CardHeader>
            <CardContent padding={false}>
              <div className="divide-y divide-border">
                {customer.websites.map((w: any) => (
                  <Link key={w.id} href={`/admin/websites/${w.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-overlay transition-colors">
                    <div>
                      <p className="text-sm font-medium">{w.name}</p>
                      <p className="text-xs text-muted">{w.domain}</p>
                    </div>
                    <StatusBadge status={w.status} size="sm" />
                  </Link>
                ))}
                {customer.websites.length === 0 && (
                  <div className="px-5 py-6 text-center text-sm text-muted">No websites</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
