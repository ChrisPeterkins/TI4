'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';

interface GameNotificationProps {
  /** Title shown in both collapsed and expanded states */
  title: string;
  /** Short summary shown when collapsed */
  summary?: string;
  /** Full content shown when expanded */
  children: ReactNode;
  /** Color theme for the notification */
  variant?: 'default' | 'warning' | 'waiting' | 'action';
  /** Whether this notification requires user action */
  requiresAction?: boolean;
  /** Callback when notification is dismissed (if allowed) */
  onDismiss?: () => void;
  /** Initial expanded state */
  defaultExpanded?: boolean;
}

const VARIANT_STYLES = {
  default: {
    bg: 'bg-gray-900/90',
    border: 'border-gray-700',
    accent: 'text-gray-400',
    indicator: 'bg-gray-500',
  },
  warning: {
    bg: 'bg-amber-950/90',
    border: 'border-amber-700/50',
    accent: 'text-amber-400',
    indicator: 'bg-amber-500',
  },
  waiting: {
    bg: 'bg-gray-900/90',
    border: 'border-gray-700',
    accent: 'text-blue-400',
    indicator: 'bg-blue-500',
  },
  action: {
    bg: 'bg-gray-900/90',
    border: 'border-yellow-500/50',
    accent: 'text-yellow-400',
    indicator: 'bg-yellow-500',
  },
};

/**
 * GameNotification - A compact, collapsible notification component
 *
 * Features:
 * - Collapsed mode: Shows just title + summary as a small pill
 * - Expanded mode: Shows full content in a compact panel
 * - Toggle with click or keyboard (N key)
 * - Subtle positioning that doesn't block the board
 */
export function GameNotification({
  title,
  summary,
  children,
  variant = 'default',
  requiresAction = false,
  onDismiss,
  defaultExpanded = false,
}: GameNotificationProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const styles = VARIANT_STYLES[variant];

  // Keyboard shortcut to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        setIsExpanded(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Collapsed view - compact pill
  if (!isExpanded) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={toggleExpanded}
          className={`flex items-center gap-2 px-3 py-1.5 ${styles.bg} backdrop-blur-sm border ${styles.border} rounded-full shadow-lg hover:opacity-100 transition-opacity group`}
        >
          {/* Pulsing indicator for action required */}
          {requiresAction && (
            <span className={`w-2 h-2 rounded-full ${styles.indicator} animate-pulse`} />
          )}

          <span className="text-white text-sm font-medium max-w-[200px] truncate">
            {title}
          </span>

          {summary && (
            <>
              <span className="text-gray-500">-</span>
              <span className={`text-xs ${styles.accent} max-w-[150px] truncate`}>
                {summary}
              </span>
            </>
          )}

          {/* Expand icon */}
          <svg
            className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Keyboard hint */}
        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Press N to expand
        </div>
      </div>
    );
  }

  // Expanded view - compact panel
  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-full max-w-md px-4">
      <div className={`${styles.bg} backdrop-blur-sm border ${styles.border} rounded-lg shadow-xl overflow-hidden`}>
        {/* Header - always visible, clickable to collapse */}
        <button
          onClick={toggleExpanded}
          className="w-full flex items-center justify-between px-3 py-2 border-b border-gray-700/50 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            {requiresAction && (
              <span className={`w-2 h-2 rounded-full ${styles.indicator} animate-pulse`} />
            )}
            <span className="text-white text-sm font-medium">{title}</span>
            {summary && (
              <span className={`text-xs ${styles.accent}`}>- {summary}</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Keyboard hint */}
            <span className="text-[10px] text-gray-600 hidden sm:block">N</span>

            {/* Collapse icon */}
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </div>
        </button>

        {/* Content area - compact */}
        <div className="max-h-[40vh] overflow-y-auto">
          {children}
        </div>

        {/* Dismiss button if allowed */}
        {onDismiss && (
          <div className="px-3 py-2 border-t border-gray-700/50">
            <button
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Simple waiting notification that's always collapsed
 */
export function WaitingNotification({
  playerName,
  action,
  subText,
}: {
  playerName: string;
  action: string;
  subText?: string;
}) {
  const [isVisible, setIsVisible] = useState(true);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        setIsVisible(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40">
        <button
          onClick={() => setIsVisible(true)}
          className="px-2 py-1 bg-gray-900/80 backdrop-blur-sm border border-gray-700 rounded-full text-gray-500 text-xs hover:text-gray-300 transition-colors"
          title="Press N to show notification"
        >
          ...
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40">
      <button
        onClick={() => setIsVisible(false)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-full shadow-lg hover:bg-gray-800/90 transition-colors group"
        title="Press N to hide"
      >
        {/* Animated dots */}
        <span className="flex gap-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </span>

        <span className="text-gray-400 text-sm">
          Waiting for <span className="text-yellow-400 font-medium">{playerName}</span>
        </span>

        <span className="text-blue-400 text-sm">{action}</span>

        {subText && (
          <span className="text-gray-500 text-xs">({subText})</span>
        )}
      </button>
    </div>
  );
}
