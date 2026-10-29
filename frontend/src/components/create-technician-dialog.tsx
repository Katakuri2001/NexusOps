'use client';

import React, { useState } from 'react';
import { Dialog, DialogHeader, DialogContent, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { api } from '@/services/api';
import { useToast } from '@/components/ui/toast';

interface CreateTechnicianDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTechnicianDialog({ open, onClose, onCreated }: CreateTechnicianDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', specialization: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast('error', 'Name, email, and password are required');
      return;
    }
    setLoading(true);
    try {
      await api.createTechnician({
        name: form.name,
        email: form.email,
        password: form.password,
        specialization: form.specialization || undefined,
      });
      toast('success', 'Technician created successfully');
      onCreated();
      onClose();
    } catch (err: any) {
      toast('error', err.message || 'Failed to create technician');
    } finally {
      setLoading(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogHeader title="Create Technician" description="Add a new technician account" onClose={onClose} />
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Full Name *</label>
              <input value={form.name} onChange={set('name')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="Mike Johnson" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Email *</label>
              <input value={form.email} onChange={set('email')} type="email" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="mike@example.com" required />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Password *</label>
              <input value={form.password} onChange={set('password')} type="password" className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="Min 8 characters" required minLength={8} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-foreground-secondary">Specialization</label>
              <input value={form.specialization} onChange={set('specialization')} className="w-full h-10 px-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all placeholder:text-muted" placeholder="Full Stack Development" />
            </div>
          </div>
        </DialogContent>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create Technician</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
