/**
 * Toast Notification System
 * 
 * Simple, lightweight toast notifications for success/error/info feedback.
 * Uses React context + framer-motion for animations.
 * 
 * Usage:
 *   import { useToast } from '@/components/shared/Toast';
 *   const { toast } = useToast();
 *   toast.success('Trade opened!');
 *   toast.error('Failed to save.');
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface ToastContextType {
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
}

// ──────────────────────────────────────────────
// Context
// ──────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    // Return no-op if used outside provider
    return {
      toast: {
        success: () => {},
        error: () => {},
        info: () => {},
        warning: () => {},
      },
    };
  }
  return context;
}

// ──────────────────────────────────────────────
// Provider
// ──────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'], duration = 4000) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: Toast = { id, message, type, duration };

    setToasts(prev => [...prev, newToast]);

    // Auto-remove after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg: string) => addToast(msg, 'success'),
    error: (msg: string) => addToast(msg, 'error', 6000),
    info: (msg: string) => addToast(msg, 'info'),
    warning: (msg: string) => addToast(msg, 'warning'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ──────────────────────────────────────────────
// Toast Item
// ──────────────────────────────────────────────

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const colors = {
    success: 'border-bullish/30 bg-bullish/10 text-bullish',
    error: 'border-bearish/30 bg-bearish/10 text-bearish',
    info: 'border-primary/30 bg-primary/10 text-primary',
    warning: 'border-warning/30 bg-warning/10 text-warning',
  };

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-slide-in',
        colors[toast.type]
      )}
    >
      <span className="text-sm font-bold">{icons[toast.type]}</span>
      <p className="text-sm flex-1">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-xs opacity-60 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}
