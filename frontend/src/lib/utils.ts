import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function getDaysUntil(date: string | Date): number {
  const now = new Date();
  const target = new Date(date);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function getDueDateLabel(date: string | Date): { label: string; urgency: 'overdue' | 'soon' | 'upcoming' | 'good' } {
  const days = getDaysUntil(date);
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, urgency: 'overdue' };
  if (days === 0) return { label: 'Due today', urgency: 'overdue' };
  if (days <= 3) return { label: `${days}d left`, urgency: 'soon' };
  if (days <= 14) return { label: `${days}d left`, urgency: 'upcoming' };
  return { label: `${days}d left`, urgency: 'good' };
}

export function getUrgencyColor(urgency: 'overdue' | 'soon' | 'upcoming' | 'good'): string {
  return {
    overdue: 'text-danger',
    soon: 'text-warning',
    upcoming: 'text-foreground-secondary',
    good: 'text-success',
  }[urgency];
}
