'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';
import { Wrench } from 'lucide-react';
import Link from 'next/link';

export default function AdminTechnicians() {
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.getTechnicians().then(setTechnicians).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="Technicians" description="Manage technician access and assignments" />

        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : technicians.length === 0 ? (
          <EmptyState icon={<Wrench className="w-8 h-8 text-muted" />} title="No technicians yet" description="Technicians will appear here once created." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicians.map((t: any) => (
              <Card key={t.id}>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-info-subtle flex items-center justify-center text-info text-sm font-semibold">{t.user.name.charAt(0)}</div>
                      <div>
                        <h3 className="font-semibold text-sm">{t.user.name}</h3>
                        <p className="text-xs text-muted">{t.user.email}</p>
                        {t.specialization && <p className="text-[10px] text-muted mt-0.5">{t.specialization}</p>}
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${t.user.isActive ? 'text-success' : 'text-danger'}`}>
                      {t.user.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  {t.assignments.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <p className="text-[10px] text-muted font-semibold uppercase tracking-wider mb-2">Assigned ({t.assignments.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {t.assignments.map((a: any) => (
                          <Link key={a.website.id} href={`/admin/websites/${a.website.id}`}
                            className="px-2 py-0.5 bg-overlay rounded text-xs hover:bg-border transition-colors">
                            {a.website.domain}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
