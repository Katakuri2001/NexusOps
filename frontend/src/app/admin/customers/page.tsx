'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { Users, Plus, ArrowRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import CreateCustomerDialog from '@/components/create-customer-dialog';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  const fetchCustomers = () => {
    setLoading(true);
    api.getCustomers().then(setCustomers).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCustomers(); }, []);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader
          title="Customers"
          description="Manage your client accounts"
          action={
            <Button icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => setShowCreate(true)}>
              Add Customer
            </Button>
          }
        />

        {loading ? <TableSkeleton rows={5} cols={5} /> : customers.length === 0 ? (
          <EmptyState icon={<Users className="w-8 h-8 text-muted" />} title="No customers yet" description="Create your first customer to get started." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {['Customer', 'Email', 'Websites', 'Status', 'Joined'].map(h => (
                      <th key={h} className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c: any) => (
                    <tr key={c.id} onClick={() => router.push(`/admin/customers/${c.id}`)} className="hover:bg-overlay cursor-pointer transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-subtle flex items-center justify-center text-primary text-xs font-semibold">{c.user.name.charAt(0)}</div>
                          <span className="text-sm font-medium">{c.user.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-foreground-secondary">{c.user.email}</td>
                      <td className="px-5 py-3"><span className="px-2 py-0.5 bg-overlay rounded text-xs font-medium">{c.websites.length}</span></td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-medium ${c.user.isActive ? 'text-success' : 'text-danger'}`}>
                          {c.user.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      <CreateCustomerDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={fetchCustomers} />
    </AppShell>
  );
}
