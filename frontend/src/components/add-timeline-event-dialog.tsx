'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface AddTimelineEventDialogProps {
  open: boolean;
  onClose: () => void;
  websiteId: string;
  onCreated: () => void;
}

export default function AddTimelineEventDialog({ open, onClose, websiteId, onCreated }: AddTimelineEventDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', icon: 'manual' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title) {
      toast('error', 'Title is required');
      return;
    }
    setLoading(true);
    try {
      await api.addTimelineEvent(websiteId, {
        title: form.title,
        description: form.description || undefined,
        icon: form.icon || undefined,
      });
      toast('success', 'Timeline event added');
      onCreated();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to add event');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Add Timeline Event" description="Record a manual event for this website" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Title *</label>
              <input value={form.title} onChange={set('title')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="e.g. Client meeting scheduled" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Description</label>
              <textarea value={form.description} onChange={set('description')} rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none" placeholder="Details about this event..." />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Icon</label>
              <select value={form.icon} onChange={set('icon')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all">
                <option value="manual">Manual Note</option>
                <option value="meeting">Meeting</option>
                <option value="update">Update</option>
                <option value="issue">Issue</option>
                <option value="milestone">Milestone</option>
              </select>
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Add Event</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
