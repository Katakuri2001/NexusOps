'use client';

import React, { useEffect, useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { EmptyState, PageHeader } from '@/components/ui/empty-state';
import { api } from '@/services/api';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

const actionColors: Record<string, string> = {
  CREATE: 'text-success', UPDATE: 'text-info', DELETE: 'text-danger', STATUS_CHANGE: 'text-warning',
  LOGIN: 'text-primary', ASSIGN_WEBSITE: 'text-info', ADD_CHARGE: 'text-warning',
};

export default function AdminActivity() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getActivityLogs().then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <PageHeader title="Activity Logs" description="Audit trail of all system actions" />

        {loading ? (
          <div className="flex items-center justify-center py-32"><div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" /></div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<Activity className="w-8 h-8 text-muted" />} title="No activity yet" description="Activity logs will appear here." />
        ) : (
          <Card>
            <div className="divide-y divide-border">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="w-8 h-8 rounded-lg bg-overlay flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className={`text-xs font-bold ${actionColors[log.action] || 'text-muted'}`}>{log.action.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{log.user?.name || 'System'}</span>
                      <span className="text-muted"> {log.action.toLowerCase().replace(/_/g, ' ')} </span>
                      <span className="text-muted">{log.entity}</span>
                    </p>
                    {log.metadata && typeof log.metadata === 'object' && (
                      <p className="text-xs text-muted mt-0.5">
                        {Object.entries(log.metadata).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted flex-shrink-0">{formatRelativeTime(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
