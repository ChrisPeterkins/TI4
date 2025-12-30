'use client';

import { useEffect, useState } from 'react';
import { useToastStore, type Toast as ToastType, type ToastType as ToastVariant } from '@/stores/toast-store';

const toastStyles: Record<ToastVariant, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-900/90',
    border: 'border-green-500/50',
    icon: '✓',
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-500/50',
    icon: '✕',
  },
  warning: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-500/50',
    icon: '⚠',
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-500/50',
    icon: 'ℹ',
  },
};

function ToastItem({ toast, onRemove }: { toast: ToastType; onRemove: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const styles = toastStyles[toast.type];

  const handleRemove = () => {
    setIsExiting(true);
    setTimeout(onRemove, 200); // Wait for exit animation
  };

  return (
    <div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg backdrop-blur
        border ${styles.bg} ${styles.border}
        transition-all duration-200
        ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
    >
      <span className="text-lg">{styles.icon}</span>
      <p className="text-white text-sm flex-1">{toast.message}</p>
      <button
        onClick={handleRemove}
        className="text-white/60 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
