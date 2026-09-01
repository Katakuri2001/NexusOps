'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface SendNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  customerId: string;
  websiteName: string;
  onSent: () => void;
}

export default function SendNotificationDialog({ open, onClose, websiteId, customerId, websiteName, onSent }: SendNotificationDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', message: '', type: 'INFORMATION', priority: 'NORMAL' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      toast('error', 'Title and message are required');
      return;
    }
    setLoading(true);
    try {
      await api.createWebsiteNotification(websiteId, {
        customerId,
        title: form.title,
        message: form.message,
        type: form.type,
        priority: form.priority,
      });
      toast('success', 'Notification sent to customer');
      setForm({ title: '', message: '', type: 'INFORMATION', priority: 'NORMAL' });
      onSent();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Send Notification" description={`Send a notification to ${websiteName}'s customer`} onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Title *</label>
              <input value={form.title} onChange={set('title')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="e.g. Scheduled maintenance notice" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Message *</label>
              <textarea value={form.message} onChange={set('message')} rows={4} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none" placeholder="Describe what the customer needs to know..." required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Type</label>
                <select value={form.type} onChange={set('type')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                  <option value="INFORMATION">Information</option>
                  <option value="BILLING">Billing</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="WARNING">Warning</option>
                  <option value="SYSTEM">System</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Priority</label>
                <select value={form.priority} onChange={set('priority')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Send Notification</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
