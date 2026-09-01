import React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-overlay text-foreground-secondary border-border',
  success: 'bg-success-subtle text-success border-success/20',
  warning: 'bg-warning-subtle text-warning border-warning/20',
  danger: 'bg-danger-subtle text-danger border-danger/20',
  info: 'bg-info-subtle text-info border-info/20',
  outline: 'bg-transparent text-foreground-secondary border-border',
};

function getStatusVariant(status: string): BadgeVariant {
  const s = status.toUpperCase();
  if (['OPERATIONAL', 'ACTIVE', 'ONLINE', 'COMPLETED', 'PAID'].includes(s)) return 'success';
  if (['MAINTENANCE', 'PENDING', 'IN_PROGRESS', 'SCHEDULED', 'EXPIRING'].includes(s)) return 'warning';
  if (['OFFLINE', 'SUSPENDED', 'CANCELLED', 'OVERDUE', 'EXPIRED'].includes(s)) return 'danger';
  if (['DEVELOPMENT', 'ATTENTION_REQUIRED'].includes(s)) return 'warning';
  return 'default';
}

function getStatusDotColor(status: string): string {
  const s = status.toUpperCase();
  if (['OPERATIONAL', 'ACTIVE', 'ONLINE', 'COMPLETED', 'PAID'].includes(s)) return 'bg-success';
  if (['MAINTENANCE', 'PENDING', 'IN_PROGRESS', 'SCHEDULED', 'EXPIRING'].includes(s)) return 'bg-warning';
  if (['OFFLINE', 'SUSPENDED', 'CANCELLED', 'OVERDUE', 'EXPIRED'].includes(s)) return 'bg-danger';
  return 'bg-muted';
}

export function Badge({ children, variant, size = 'md', dot, className }: BadgeProps) {
  const v = variant || 'default';
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 font-medium rounded-full border",
      variantStyles[v],
      size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs',
      className
    )}>
      {dot !== false && (
        <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", getStatusDotColor(children as string))} />
      )}
      {typeof children === 'string'
        ? children.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
        : children}
    </span>
  );
}

export function StatusBadge({ status, size = 'md', className }: { status: string; size?: 'sm' | 'md'; className?: string }) {
  return (
    <Badge variant={getStatusVariant(status)} size={size} className={className}>
      {status}
    </Badge>
  );
}
