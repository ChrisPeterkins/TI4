'use client';

import { useEffect, useState, useCallback } from 'react';
import { useConfirmStore, type ConfirmVariant } from '@/stores/confirm-store';

const variantStyles: Record<ConfirmVariant, {
  bg: string;
  border: string;
  headerBg: string;
  confirmBg: string;
  confirmHover: string;
  icon: string;
}> = {
  danger: {
    bg: 'bg-gray-900',
    border: 'border-red-500/30',
    headerBg: 'bg-gradient-to-r from-red-900/50 to-red-800/30',
    confirmBg: 'bg-red-600',
    confirmHover: 'hover:bg-red-700',
    icon: '!',
  },
  warning: {
    bg: 'bg-gray-900',
    border: 'border-yellow-500/30',
    headerBg: 'bg-gradient-to-r from-yellow-900/50 to-yellow-800/30',
    confirmBg: 'bg-yellow-600',
    confirmHover: 'hover:bg-yellow-700',
    icon: '?',
  },
  info: {
    bg: 'bg-gray-900',
    border: 'border-blue-500/30',
    headerBg: 'bg-gradient-to-r from-blue-900/50 to-blue-800/30',
    confirmBg: 'bg-blue-600',
    confirmHover: 'hover:bg-blue-700',
    icon: 'i',
  },
};

/**
 * ConfirmDialog component - renders the global confirmation dialog
 *
 * Add this component once at the app root (e.g., in layout.tsx)
 */
export function ConfirmDialog() {
  const {
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    variant,
    dontAskAgainKey,
    handleConfirm,
    handleCancel,
  } = useConfirmStore();

  const [dontAskAgain, setDontAskAgain] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const styles = variantStyles[variant];

  // Reset checkbox when dialog opens
  useEffect(() => {
    if (isOpen) {
      setDontAskAgain(false);
      setIsAnimatingOut(false);
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, dontAskAgain]);

  const onConfirm = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      handleConfirm(dontAskAgain);
    }, 150);
  }, [handleConfirm, dontAskAgain]);

  const onCancel = useCallback(() => {
    setIsAnimatingOut(true);
    setTimeout(() => {
      handleCancel();
    }, 150);
  }, [handleCancel]);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/70 backdrop-blur-sm
        transition-opacity duration-150
        ${isAnimatingOut ? 'opacity-0' : 'opacity-100'}
      `}
      onClick={onCancel}
    >
      <div
        className={`
          ${styles.bg} rounded-xl border ${styles.border}
          w-full max-w-md mx-4 shadow-2xl
          transition-all duration-150
          ${isAnimatingOut ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
        `}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        {/* Header */}
        <div className={`${styles.headerBg} px-5 py-4 rounded-t-xl border-b border-gray-700/50`}>
          <div className="flex items-center gap-3">
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center
              ${variant === 'danger' ? 'bg-red-600' : variant === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'}
              text-white font-bold
            `}>
              {styles.icon}
            </div>
            <h2 id="confirm-title" className="text-lg font-semibold text-white">
              {title}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p id="confirm-message" className="text-gray-300 text-sm leading-relaxed">
            {message}
          </p>

          {/* Don't ask again checkbox */}
          {dontAskAgainKey && (
            <label className="flex items-center gap-2 mt-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-yellow-500 focus:ring-yellow-500 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                Don&apos;t ask again
              </span>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700/50 flex items-center justify-between">
          {/* Keyboard hints */}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">Esc</kbd> cancel
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">Enter</kbd> confirm
            </span>
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`
                px-4 py-2 text-sm font-medium text-white rounded-lg
                ${styles.confirmBg} ${styles.confirmHover}
                transition-colors
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
