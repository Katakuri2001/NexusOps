'use client';

import React, { useState } from 'react';
import AppShell from '@/components/layout/app-shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/store/auth-provider';
import { KeyRound } from 'lucide-react';
import ChangePasswordDialog from '@/components/change-password-dialog';

export default function AdminProfile() {
  const { user } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <AppShell>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Profile</h1>
          <p className="text-sm text-muted mt-1">Your account information</p>
        </div>

        <Card>
          <CardContent>
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
              <div className="w-14 h-14 rounded-2xl bg-primary-subtle flex items-center justify-center text-primary text-xl font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold">{user?.name}</h2>
                <p className="text-sm text-muted">{user?.email}</p>
              </div>
              <Button variant="secondary" size="sm" icon={<KeyRound className="w-4 h-4" />} onClick={() => setShowPasswordDialog(true)}>
                Change Password
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Name', value: user?.name },
                { label: 'Email', value: user?.email },
                { label: 'Role', value: 'Owner' },
                { label: 'Status', value: 'Active' },
              ].map(r => (
                <div key={r.label} className="p-3 bg-background rounded-lg border border-border">
                  <p className="text-[10px] text-muted uppercase tracking-wider">{r.label}</p>
                  <p className="text-sm font-medium mt-1">{r.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <ChangePasswordDialog open={showPasswordDialog} onClose={() => setShowPasswordDialog(false)} />
      </div>
    </AppShell>
  );
}
