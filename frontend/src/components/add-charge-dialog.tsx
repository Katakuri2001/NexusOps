'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface AddChargeDialogProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  onCreated: () => void;
}

export default function AddChargeDialog({ open, onClose, websiteId, onCreated }: AddChargeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', date: new Date().toISOString().split('T')[0], billingType: 'ONE_TIME', status: 'pending', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast('error', 'Description and amount are required');
      return;
    }
    setLoading(true);
    try {
      await api.addCharge(websiteId, {
        description: form.description,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
        billingType: form.billingType,
        status: form.status,
        notes: form.notes || undefined,
      });
      toast('success', 'Charge added');
      onCreated();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to add charge');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Add Charge" description="Add a billing charge to this website" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Description *</label>
              <input value={form.description} onChange={set('description')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="e.g. Logo design" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Amount *</label>
                <input value={form.amount} onChange={set('amount')} type="number" step="0.01" min="0" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="0.00" required />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Date *</label>
                <input value={form.date} onChange={set('date')} type="date" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Type</label>
                <select value={form.billingType} onChange={set('billingType')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                  <option value="ONE_TIME">One-time</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Status</label>
                <select value={form.status} onChange={set('status')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none" placeholder="Optional notes..." />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Charge</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
