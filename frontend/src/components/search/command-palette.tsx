'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth-provider';
import { api } from '@/services/api';
import { cn } from '@/lib/utils';
import { Search, Globe, Users, Wrench, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchResult {
  type: string;
  id: string;
  name: string;
  subtitle: string;
  href: string;
  icon: React.ReactNode;
}

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (open) onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const items: SearchResult[] = [];
      const role = user?.role;

      if (role === 'OWNER') {
        const [websites, customers, technicians] = await Promise.all([
          api.getWebsites().catch(() => []),
          api.getCustomers().catch(() => []),
          api.getTechnicians().catch(() => []),
        ]);

        websites.forEach((w: any) => {
          if (w.name.toLowerCase().includes(q.toLowerCase()) || w.domain.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              type: 'Website',
              id: w.id,
              name: w.name,
              subtitle: w.domain,
              href: `/admin/websites/${w.id}`,
              icon: <Globe className="w-4 h-4 text-primary" />,
            });
          }
        });

        customers.forEach((c: any) => {
          if (c.user?.name?.toLowerCase().includes(q.toLowerCase()) || c.user?.email?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              type: 'Customer',
              id: c.id,
              name: c.user.name,
              subtitle: c.user.email,
              href: `/admin/customers/${c.id}`,
              icon: <Users className="w-4 h-4 text-info" />,
            });
          }
        });

        technicians.forEach((t: any) => {
          if (t.user?.name?.toLowerCase().includes(q.toLowerCase())) {
            items.push({
              type: 'Technician',
              id: t.id,
              name: t.user.name,
              subtitle: t.specialization || 'Technician',
              href: `/admin/technicians/${t.id}`,
              icon: <Wrench className="w-4 h-4 text-warning" />,
            });
          }
        });
      } else {
        const websites = await api.getWebsites().catch(() => []);
        websites.forEach((w: any) => {
          if (w.name.toLowerCase().includes(q.toLowerCase()) || w.domain.toLowerCase().includes(q.toLowerCase())) {
            const base = role === 'TECHNICIAN' ? '/technician' : '/dashboard';
            items.push({
              type: 'Website',
              id: w.id,
              name: w.name,
              subtitle: w.domain,
              href: `${base}/websites/${w.id}`,
              icon: <Globe className="w-4 h-4 text-primary" />,
            });
          }
        });
      }

      setResults(items.slice(0, 8));
    } catch {}
    setLoading(false);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const handleSelect = (href: string) => {
    router.push(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      handleSelect(results[selectedIdx].href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
            className="relative w-full max-w-lg bg-elevated border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 border-b border-border">
              <Search className="w-4 h-4 text-muted flex-shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelectedIdx(0); }}
                onKeyDown={handleKeyDown}
                placeholder="Search websites, customers, technicians..."
                className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted"
              />
              {query && (
                <button onClick={() => setQuery('')} className="p-1 rounded hover:bg-overlay text-muted">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading && (
                <div className="px-4 py-8 text-center">
                  <div className="w-5 h-5 border-2 border-border border-t-primary rounded-full animate-spin mx-auto" />
                </div>
              )}

              {!loading && query && results.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-muted">No results found</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <div className="py-2">
                  {results.map((result, i) => (
                    <motion.button
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.15 }}
                      onClick={() => handleSelect(result.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                        selectedIdx === i ? "bg-primary-subtle" : "hover:bg-overlay"
                      )}
                    >
                      <div className="p-1.5 rounded-md bg-overlay">
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{result.name}</p>
                        <p className="text-xs text-muted truncate">{result.subtitle}</p>
                      </div>
                      <span className="text-[10px] text-muted font-medium px-1.5 py-0.5 bg-overlay rounded">
                        {result.type}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}

              {!query && (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-muted">Type to search across your workspace</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
