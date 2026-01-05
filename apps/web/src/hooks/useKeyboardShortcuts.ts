'use client';

import { useEffect, useCallback, useMemo } from 'react';

export interface ShortcutDefinition {
  key: string;
  description: string;
  handler: () => void;
  /** If true, allows the shortcut even with Ctrl/Meta held */
  allowModifiers?: boolean;
  /** Categories for grouping in help modal */
  category?: 'navigation' | 'actions' | 'panels' | 'general';
}

export interface UseKeyboardShortcutsOptions {
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
  /** Shortcuts that override the base set */
  overrides?: Record<string, () => void>;
}

/**
 * Keyboard shortcuts configuration
 * Keys are lowercase (or 'Escape', 'Enter', etc. for special keys)
 */
export const SHORTCUT_DEFINITIONS: Record<string, Omit<ShortcutDefinition, 'handler' | 'key'>> = {
  // General
  'Escape': { description: 'Close modal / Cancel', category: 'general' },
  '?': { description: 'Show keyboard shortcuts', category: 'general' },
  'n': { description: 'Toggle notifications', category: 'general' },

  // Navigation / Panels
  't': { description: 'Open technology panel', category: 'panels' },
  'a': { description: 'Open action cards', category: 'panels' },
  'c': { description: 'Toggle chat', category: 'panels' },
  'l': { description: 'Toggle game log', category: 'panels' },
  'o': { description: 'Open objectives', category: 'panels' },

  // Game Actions
  'p': { description: 'Pass turn', category: 'actions' },
  'Enter': { description: 'Confirm action', category: 'actions' },

  // Strategy card selection (1-8)
  '1': { description: 'Select strategy card 1', category: 'actions' },
  '2': { description: 'Select strategy card 2', category: 'actions' },
  '3': { description: 'Select strategy card 3', category: 'actions' },
  '4': { description: 'Select strategy card 4', category: 'actions' },
  '5': { description: 'Select strategy card 5', category: 'actions' },
  '6': { description: 'Select strategy card 6', category: 'actions' },
  '7': { description: 'Select strategy card 7', category: 'actions' },
  '8': { description: 'Select strategy card 8', category: 'actions' },
};

/**
 * Get all shortcut definitions with their keys
 */
export function getShortcutDefinitions(): Array<{ key: string } & Omit<ShortcutDefinition, 'handler' | 'key'>> {
  return Object.entries(SHORTCUT_DEFINITIONS).map(([key, def]) => ({
    key,
    ...def,
  }));
}

/**
 * Get shortcuts grouped by category
 */
export function getShortcutsByCategory(): Record<string, Array<{ key: string; description: string }>> {
  const grouped: Record<string, Array<{ key: string; description: string }>> = {
    general: [],
    panels: [],
    actions: [],
    navigation: [],
  };

  for (const [key, def] of Object.entries(SHORTCUT_DEFINITIONS)) {
    const category = def.category || 'general';
    grouped[category].push({ key, description: def.description });
  }

  return grouped;
}

/**
 * Hook for handling keyboard shortcuts
 *
 * @param handlers - Map of key to handler function
 * @param options - Configuration options
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   'p': () => handlePass(),
 *   'Escape': () => closeModal(),
 *   't': () => setShowTechPanel(true),
 * });
 * ```
 */
export function useKeyboardShortcuts(
  handlers: Record<string, () => void>,
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, overrides } = options;

  // Merge handlers with overrides
  const mergedHandlers = useMemo(() => ({
    ...handlers,
    ...overrides,
  }), [handlers, overrides]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Don't trigger if typing in an input or textarea
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      (e.target instanceof HTMLElement && e.target.isContentEditable)
    ) {
      return;
    }

    // Get the key - use e.key for special keys, lowercase for letters
    let key = e.key;

    // Don't trigger with modifier keys (except Shift for special chars like ?)
    // Allow Escape to work with modifiers
    if (key !== 'Escape' && (e.ctrlKey || e.metaKey || e.altKey)) {
      return;
    }

    // Normalize key for lookup
    // For letters, use lowercase
    // For special keys like Escape, Enter, keep as-is
    const normalizedKey = key.length === 1 ? key.toLowerCase() : key;

    const handler = mergedHandlers[normalizedKey];
    if (handler) {
      e.preventDefault();
      handler();
    }
  }, [enabled, mergedHandlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Format a key for display (e.g., "Enter" -> "Enter", "?" -> "?")
 */
export function formatKeyForDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    'Escape': 'Esc',
    'Enter': 'Enter',
    ' ': 'Space',
  };

  return keyMap[key] || key.toUpperCase();
}
