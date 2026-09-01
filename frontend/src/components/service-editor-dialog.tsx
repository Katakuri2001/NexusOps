'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface ServiceEditorDialogProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  serviceType: 'hosting' | 'database' | 'server';
  existingData?: any;
  onSaved: () => void;
}

const labels = {
  hosting: { title: 'Hosting Service', provider: 'Hosting Provider', costLabel: 'Monthly Cost', showPlan: false },
  database: { title: 'Database Service', provider: 'Database Provider', costLabel: 'Monthly Cost', showPlan: false },
  server: { title: 'Server Service', provider: 'Server Provider', costLabel: 'Monthly Cost', showPlan: true },
};

export default function ServiceEditorDialog({ open, onClose, websiteId, serviceType, existingData, onSaved }: ServiceEditorDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const l = labels[serviceType];
  const [form, setForm] = useState({
    provider: '', plan: '', cost: '', startDate: '', dueDate: '', status: 'active',
  });

  useEffect(() => {
    if (open && existingData) {
      setForm({
        provider: existingData.provider || '',
        plan: existingData.plan || '',
        cost: String(existingData.cost || existingData.monthlyCost || ''),
        startDate: existingData.startDate ? existingData.startDate.split('T')[0] : '',
        dueDate: existingData.dueDate ? existingData.dueDate.split('T')[0] : '',
        status: existingData.status || 'active',
      });
    } else if (open) {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      setForm({ provider: '', plan: '', cost: '', startDate: today, dueDate: nextYear.toISOString().split('T')[0], status: 'active' });
    }
  }, [open, existingData, serviceType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data: any = {
        provider: form.provider || undefined,
        status: form.status,
      };
      if (serviceType === 'hosting') {
        data.cost = form.cost ? parseFloat(form.cost) : undefined;
      } else if (serviceType === 'database') {
        data.monthlyCost = form.cost ? parseFloat(form.cost) : undefined;
      } else {
        data.plan = form.plan || undefined;
        data.cost = form.cost ? parseFloat(form.cost) : undefined;
      }
      if (form.startDate) data.startDate = new Date(form.startDate).toISOString();
      if (form.dueDate) data.dueDate = new Date(form.dueDate).toISOString();

      const apiMethod = serviceType === 'hosting' ? 'updateWebsiteHosting' : serviceType === 'database' ? 'updateWebsiteDatabase' : 'updateWebsiteServer';
      await (api as any)[apiMethod](websiteId, data);
      toast('success', `${l.title} updated`);
      onSaved();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title={`Edit ${l.title}`} onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">{l.provider}</label>
              <input value={form.provider} onChange={set('provider')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder={`e.g. ${serviceType === 'hosting' ? 'Cloudflare' : serviceType === 'database' ? 'PlanetScale' : 'AWS'}`} />
            </div>
            {l.showPlan && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Plan</label>
                <input value={form.plan} onChange={set('plan')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="e.g. t3.medium" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">{l.costLabel}</label>
                <input value={form.cost} onChange={set('cost')} type="number" step="0.01" min="0" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="0.00" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Status</label>
                <select value={form.status} onChange={set('status')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Start Date</label>
                <input value={form.startDate} onChange={set('startDate')} type="date" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Due Date</label>
                <input value={form.dueDate} onChange={set('dueDate')} type="date" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" />
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
