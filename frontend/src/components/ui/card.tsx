'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { staggerItem } from '@/components/motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glass?: boolean;
}

export function Card({ children, className, hover, glass }: CardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border",
      glass ? "glass" : "bg-elevated",
      hover && "transition-colors duration-150 hover:border-border-hover hover:bg-overlay cursor-pointer",
      className
    )}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-5 py-4 border-b border-border", className)}>
      <div>{children}</div>
      {action}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export function CardTitle({ children, subtitle, className }: CardTitleProps) {
  return (
    <div className={className}>
      <h3 className="text-sm font-semibold">{children}</h3>
      {subtitle && <p className="text-xs text-muted mt-0.5">{subtitle}</p>}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function CardContent({ children, className, padding = true }: CardContentProps) {
  return (
    <div className={cn(padding && "p-5", className)}>
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: { value: string; type: 'up' | 'down' | 'neutral' };
  icon: React.ReactNode;
  className?: string;
}

export function StatCard({ label, value, change, icon, className }: StatCardProps) {
  return (
    <motion.div
      variants={staggerItem}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={cn("rounded-xl border border-border bg-elevated p-4", className)}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {change && (
            <p className={cn("text-xs font-medium",
              change.type === 'up' ? 'text-success' : change.type === 'down' ? 'text-danger' : 'text-muted'
            )}>
              {change.type === 'up' ? '↑' : change.type === 'down' ? '↓' : '→'} {change.value}
            </p>
          )}
        </div>
        <div className="p-2 rounded-lg bg-primary-subtle text-primary">
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
