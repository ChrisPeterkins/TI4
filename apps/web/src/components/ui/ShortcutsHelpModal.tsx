'use client';

import { useEffect, useCallback } from 'react';
import { getShortcutsByCategory, formatKeyForDisplay } from '@/hooks/useKeyboardShortcuts';

interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  panels: 'Panels',
  actions: 'Game Actions',
  navigation: 'Navigation',
};

const CATEGORY_ORDER = ['actions', 'panels', 'general'];

/**
 * ShortcutsHelpModal - Shows all available keyboard shortcuts
 *
 * Triggered by pressing '?' key
 */
export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  // Close on Escape
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === '?') {
      e.preventDefault();
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const shortcutsByCategory = getShortcutsByCategory();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 rounded-xl border border-gray-700 w-full max-w-lg mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/30 px-6 py-4 rounded-t-xl border-b border-gray-700/50">
          <div className="flex items-center justify-between">
            <h2 id="shortcuts-title" className="text-lg font-semibold text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="space-y-6">
            {CATEGORY_ORDER.map(category => {
              const shortcuts = shortcutsByCategory[category];
              if (!shortcuts || shortcuts.length === 0) return null;

              return (
                <div key={category}>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[category] || category}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {shortcuts.map(({ key, description }) => (
                      <div
                        key={key}
                        className="flex items-center justify-between px-3 py-2 bg-gray-800/50 rounded-lg"
                      >
                        <span className="text-gray-300 text-sm">{description}</span>
                        <kbd className="px-2 py-1 rounded bg-gray-700 text-gray-200 font-mono text-xs min-w-[28px] text-center">
                          {formatKeyForDisplay(key)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tips section */}
          <div className="mt-6 pt-4 border-t border-gray-700/50">
            <h3 className="text-sm font-semibold text-gray-400 mb-2">Tips</h3>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>- Shortcuts are disabled when typing in text fields</li>
              <li>- Press <kbd className="px-1 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">H</kbd> to toggle the hints panel</li>
              <li>- Context-specific shortcuts appear based on game phase</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-700/50 flex justify-end">
          <span className="text-xs text-gray-500">
            Press <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">?</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-400 font-mono">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
