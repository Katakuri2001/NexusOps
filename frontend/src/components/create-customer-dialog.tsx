'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface CreateCustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateCustomerDialog({ open, onClose, onCreated }: CreateCustomerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', company: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast('error', 'Name, email, and password are required');
      return;
    }
    setLoading(true);
    try {
      await api.createCustomer({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
        company: form.company || undefined,
        address: form.address || undefined,
      });
      toast('success', 'Customer created successfully');
      onCreated();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create customer');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Create Customer" description="Add a new client account" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Full Name *</label>
              <input value={form.name} onChange={set('name')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="John Doe" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Email *</label>
              <input value={form.email} onChange={set('email')} type="email" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="john@example.com" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Password *</label>
              <input value={form.password} onChange={set('password')} type="password" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="Min 8 characters" required minLength={8} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Phone</label>
                <input value={form.phone} onChange={set('phone')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="+1 555-0123" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground-secondary">Company</label>
                <input value={form.company} onChange={set('company')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="Acme Inc" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Address</label>
              <input value={form.address} onChange={set('address')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="123 Main St, City" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Customer</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
