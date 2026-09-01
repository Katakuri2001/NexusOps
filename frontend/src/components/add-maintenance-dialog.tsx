'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface AddMaintenanceDialogProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  onCreated: () => void;
}

export default function AddMaintenanceDialog({ open, onClose, websiteId, onCreated }: AddMaintenanceDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', items: '', status: 'completed', notes: '', isInternal: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast('error', 'Title is required');
      return;
    }
    setLoading(true);
    try {
      const items = form.items ? form.items.split('\n').filter(i => i.trim()) : [];
      await api.createMaintenance(websiteId, {
        title: form.title,
        description: form.description || undefined,
        items,
        status: form.status,
        notes: form.notes || undefined,
        isInternal: form.isInternal,
      });
      toast('success', 'Maintenance record added');
      onCreated();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to add maintenance record');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Add Maintenance Record" description="Log maintenance work done on this website" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Title *</label>
              <input value={form.title} onChange={set('title')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="e.g. Security patch update" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none" placeholder="What was done..." />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Checklist Items (one per line)</label>
              <textarea value={form.items} onChange={set('items')} rows={4} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none font-mono text-xs" placeholder="Updated WordPress core&#10;Patched XSS vulnerability&#10;Optimized database" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Status</label>
                <select value={form.status} onChange={set('status')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isInternal} onChange={set('isInternal')} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                  <span className="text-sm text-foreground-secondary">Internal only</span>
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none" placeholder="Internal notes..." />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Record</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
