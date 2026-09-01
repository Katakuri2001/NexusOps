'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface CreateWebsiteDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateWebsiteDialog({ open, onClose, onCreated }: CreateWebsiteDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    domain: '',
    description: '',
    developerName: '',
    websiteType: '',
    customerId: '',
    status: 'DEVELOPMENT',
  });

  useEffect(() => {
    if (open) {
      api.getCustomers().then(setCustomers).catch(() => {});
      setForm({ name: '', domain: '', description: '', developerName: '', websiteType: '', customerId: '', status: 'DEVELOPMENT' });
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.domain || !form.customerId) {
      toast('error', 'Name, domain, and customer are required');
      return;
    }

    setLoading(true);
    try {
      await api.createWebsite({
        name: form.name,
        domain: form.domain,
        description: form.description || undefined,
        developerName: form.developerName || undefined,
        websiteType: form.websiteType || undefined,
        customerId: form.customerId,
        status: form.status,
      });
      toast('success', 'Website created successfully');
      onCreated();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create website');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Create Website" description="Add a new client website" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            {/* Customer */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Customer *</label>
              <select
                value={form.customerId}
                onChange={set('customerId')}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                required
              >
                <option value="">Select customer</option>
                {customers.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.user?.name || c.name} — {c.user?.email}</option>
                ))}
              </select>
            </div>

            {/* Name + Domain */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Website Name *</label>
                <input
                  value={form.name}
                  onChange={set('name')}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted"
                  placeholder="My Website"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Domain *</label>
                <input
                  value={form.domain}
                  onChange={set('domain')}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted"
                  placeholder="example.com"
                  required
                />
              </div>
            </div>

            {/* Developer Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Developer Name</label>
              <input
                value={form.developerName}
                onChange={set('developerName')}
                className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted"
                placeholder="e.g. Jane Smith"
              />
            </div>

            {/* Type + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Website Type</label>
                <select
                  value={form.websiteType}
                  onChange={set('websiteType')}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                >
                  <option value="">Select type</option>
                  <option value="ECOMMERCE">E-Commerce</option>
                  <option value="BLOG">Blog</option>
                  <option value="PORTFOLIO">Portfolio</option>
                  <option value="CORPORATE">Corporate</option>
                  <option value="LANDING">Landing Page</option>
                  <option value="WEB_APP">Web App</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Status</label>
                <select
                  value={form.status}
                  onChange={set('status')}
                  className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                >
                  <option value="DEVELOPMENT">Development</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="OPERATIONAL">Operational</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Description</label>
              <textarea
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted resize-none"
                placeholder="Brief description of the website..."
              />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Website</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
