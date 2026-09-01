'use client';

import React, { useEffect, useState, useMemo } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/input';
import { StatusBadge } from '@/components/ui/badge';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/skeleton';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { Globe, Plus, Search, Filter, ArrowRight } from 'lucide-react';
import { formatRelativeTime, getDueDateLabel, getUrgencyColor } from '@/lib/utils';
import Link from 'next/link';
import CreateWebsiteDialog from '@/components/create-website-dialog';

export default function AdminWebsites() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const data = await api.getWebsites();
        setWebsites(data);
      } catch {} finally {
        setLoading(false);
      }
    };
    fetchWebsites();
  }, []);

  const filtered = useMemo(() => {
    return websites.filter(w => {
      const matchSearch = !search || w.name.toLowerCase().includes(search.toLowerCase()) || w.domain.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'all' || w.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [websites, search, statusFilter]);

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'OPERATIONAL', label: 'Operational' },
    { value: 'MAINTENANCE', label: 'Maintenance' },
    { value: 'ATTENTION_REQUIRED', label: 'Attention Required' },
    { value: 'OFFLINE', label: 'Offline' },
    { value: 'DEVELOPMENT', label: 'Development' },
  ];

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader
          title="Websites"
          description="Manage all client websites"
          action={
            <Button icon={<Plus className="w-4 h-4" />} size="sm" onClick={() => setShowCreate(true)}>
              Add Website
            </Button>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search websites..."
              className="w-full h-9 pl-9 pr-3 bg-elevated border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 placeholder:text-muted"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 bg-elevated border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none cursor-pointer min-w-[160px]"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Globe className="w-8 h-8 text-muted" />}
            title={search || statusFilter !== 'all' ? 'No matching websites' : 'No websites yet'}
            description={search || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Create your first website to get started.'}
          />
        ) : (
          <>
            {/* Desktop table */}
            <Card className="hidden lg:block overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">Website</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">Customer</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">Status</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">Services</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">Next Due</th>
                      <th className="text-left text-[10px] font-semibold uppercase tracking-wider text-muted px-5 py-3">Updated</th>
                      <th className="w-10 px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((w: any) => {
                      const due = w.hosting?.dueDate ? getDueDateLabel(w.hosting.dueDate) : null;
                      return (
                        <tr
                          key={w.id}
                          onClick={() => router.push(`/admin/websites/${w.id}`)}
                          className="hover:bg-overlay cursor-pointer transition-colors"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-overlay flex items-center justify-center text-xs font-semibold text-muted flex-shrink-0">
                                {w.name.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{w.name}</p>
                                <p className="text-xs text-muted">{w.domain}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-foreground-secondary">{w.customer?.user?.name || '—'}</td>
                          <td className="px-5 py-3"><StatusBadge status={w.status} size="sm" /></td>
                          <td className="px-5 py-3">
                            <div className="flex gap-1">
                              {w.hosting && <span className="w-1.5 h-1.5 rounded-full bg-success" title="Hosting" />}
                              {w.database && <span className="w-1.5 h-1.5 rounded-full bg-success" title="Database" />}
                              {w.server && <span className="w-1.5 h-1.5 rounded-full bg-success" title="Server" />}
                              {w.plan && <span className="w-1.5 h-1.5 rounded-full bg-success" title="Plan" />}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            {due ? (
                              <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-xs text-muted">{formatRelativeTime(w.updatedAt)}</td>
                          <td className="px-5 py-3">
                            <ArrowRight className="w-4 h-4 text-muted" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {filtered.map((w: any) => {
                const due = w.hosting?.dueDate ? getDueDateLabel(w.hosting.dueDate) : null;
                return (
                  <Link key={w.id} href={`/admin/websites/${w.id}`}>
                    <Card hover className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-overlay flex items-center justify-center text-sm font-semibold text-muted">
                            {w.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{w.name}</p>
                            <p className="text-xs text-muted">{w.domain}</p>
                          </div>
                        </div>
                        <StatusBadge status={w.status} size="sm" />
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted">{w.customer?.user?.name || '—'}</span>
                        {due && <span className={`text-xs font-medium ${getUrgencyColor(due.urgency)}`}>{due.label}</span>}
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
      <CreateWebsiteDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setLoading(true); api.getWebsites().then(setWebsites).finally(() => setLoading(false)); }}
      />
    </AppShell>
  );
}
