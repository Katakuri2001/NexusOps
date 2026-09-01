'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { FileText } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function TechnicianMaintenance() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const w = await api.getWebsites();
        setWebsites(w);
        const all: any[] = [];
        for (const site of w) {
          try {
            const records = await api.getWebsiteMaintenance(site.id);
            all.push(...records.map(r => ({ ...r, website: site })));
          } catch {}
        }
        all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMaintenance(all);
      } catch {} finally { setLoading(false); }
    };
    fetchData();
  }, []);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="Maintenance History" description="Recent maintenance across your assigned websites" />

        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : maintenance.length === 0 ? (
          <EmptyState icon={<FileText className="w-8 h-8 text-muted" />} title="No maintenance records" description="Maintenance records will appear here." />
        ) : (
          <div className="space-y-3">
            {maintenance.map((r: any) => (
              <Card key={r.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium">{r.title}</h3>
                      <p className="text-xs text-muted mt-0.5">{r.website?.name} · {formatDate(r.createdAt)} · {r.createdBy?.name || 'System'}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${r.status === 'completed' ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'}`}>{r.status}</span>
                  </div>
                  {(() => {
                    let items: string[] = [];
                    try {
                      items = Array.isArray(r.items) ? r.items : typeof r.items === 'string' ? JSON.parse(r.items) : [];
                    } catch {}
                    return items.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {items.map((item: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-success-subtle text-success rounded text-xs">✓ {item}</span>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
