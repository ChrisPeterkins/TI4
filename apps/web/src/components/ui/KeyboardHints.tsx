'use client';

import { useState, useEffect } from 'react';
import { formatKeyForDisplay } from '@/hooks/useKeyboardShortcuts';

export interface KeyHint {
  key: string;
  label: string;
}

export interface KeyboardHintsProps {
  /** Hints to display */
  hints: KeyHint[];
  /** Whether to show the hints panel */
  show?: boolean;
  /** Position on screen */
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
}

const HINTS_STORAGE_KEY = 'ti4_keyboard_hints_visible';

/**
 * KeyboardHints - Shows contextual keyboard shortcuts in the corner of the screen
 *
 * @example
 * ```tsx
 * <KeyboardHints
 *   hints={[
 *     { key: 'p', label: 'Pass' },
 *     { key: 'Enter', label: 'Confirm' },
 *     { key: 'Escape', label: 'Cancel' },
 *   ]}
 * />
 * ```
 */
export function KeyboardHints({
  hints,
  show = true,
  position = 'bottom-right',
}: KeyboardHintsProps) {
  const [isVisible, setIsVisible] = useState(true);

  // Load visibility preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(HINTS_STORAGE_KEY);
      if (stored !== null) {
        setIsVisible(stored === 'true');
      }
    }
  }, []);

  // Toggle with 'h' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setIsVisible(prev => {
          const newValue = !prev;
          localStorage.setItem(HINTS_STORAGE_KEY, String(newValue));
          return newValue;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!show || hints.length === 0) return null;

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  // Collapsed state - just show toggle hint
  if (!isVisible) {
    return (
      <div className={`fixed ${positionClasses[position]} z-30`}>
        <button
          onClick={() => {
            setIsVisible(true);
            localStorage.setItem(HINTS_STORAGE_KEY, 'true');
          }}
          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          title="Press H to show keyboard hints"
        >
          <kbd className="px-1 py-0.5 rounded bg-gray-800/50 text-gray-500 font-mono text-[10px]">H</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed ${positionClasses[position]} z-30`}>
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-lg">
        {hints.map(({ key, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-gray-700 text-gray-300 font-mono text-xs min-w-[20px] text-center">
              {formatKeyForDisplay(key)}
            </kbd>
            <span className="text-gray-400 text-xs">{label}</span>
          </div>
        ))}

        {/* Separator */}
        <div className="w-px h-4 bg-gray-700 mx-1" />

        {/* Toggle hint */}
        <button
          onClick={() => {
            setIsVisible(false);
            localStorage.setItem(HINTS_STORAGE_KEY, 'false');
          }}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors"
          title="Press H to hide"
        >
          <kbd className="px-1 py-0.5 rounded bg-gray-700/50 text-gray-500 font-mono text-[10px]">H</kbd>
          <span className="text-[10px]">hide</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Get contextual hints based on current game phase
 */
export function getHintsForPhase(phase: string, isMyTurn: boolean): KeyHint[] {
  const baseHints: KeyHint[] = [
    { key: '?', label: 'Help' },
    { key: 'n', label: 'Notifications' },
  ];

  if (!isMyTurn) {
    return baseHints;
  }

  switch (phase) {
    case 'strategy':
      return [
        { key: '1', label: 'Card 1' },
        { key: '2', label: 'Card 2' },
        { key: '3', label: 'Card 3' },
        { key: '4', label: 'Card 4' },
        ...baseHints,
      ];

    case 'action':
      return [
        { key: 'p', label: 'Pass' },
        { key: 't', label: 'Tech' },
        { key: 'a', label: 'Actions' },
        ...baseHints,
      ];

    case 'status':
      return [
        { key: 'o', label: 'Objectives' },
        { key: 'Enter', label: 'Confirm' },
        ...baseHints,
      ];

    case 'agenda':
      return [
        { key: 'Enter', label: 'Vote' },
        { key: 'Escape', label: 'Cancel' },
        ...baseHints,
      ];

    default:
      return baseHints;
  }
}
