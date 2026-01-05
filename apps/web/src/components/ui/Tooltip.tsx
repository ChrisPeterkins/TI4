'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { createPortal } from 'react-dom';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Content to show in the tooltip - can be string or React nodes for rich content */
  content: ReactNode;
  /** Element that triggers the tooltip on hover */
  children: ReactNode;
  /** Position relative to the trigger element */
  position?: TooltipPosition;
  /** Delay before showing tooltip in ms (default: 300) */
  delay?: number;
  /** Maximum width of the tooltip (default: 280) */
  maxWidth?: number;
  /** Whether the tooltip is disabled */
  disabled?: boolean;
  /** Additional className for the tooltip content */
  className?: string;
}

const ARROW_SIZE = 6;
const OFFSET = 8;

/**
 * Tooltip component - shows a floating tooltip on hover
 *
 * @example
 * ```tsx
 * // Simple text tooltip
 * <Tooltip content="This is a tooltip">
 *   <button>Hover me</button>
 * </Tooltip>
 *
 * // Rich content tooltip
 * <Tooltip
 *   content={
 *     <div>
 *       <strong>Infantry</strong>
 *       <p>Combat: 8</p>
 *       <p>Cost: 0.5</p>
 *     </div>
 *   }
 *   position="right"
 * >
 *   <span>Infantry Icon</span>
 * </Tooltip>
 * ```
 */
export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  maxWidth = 280,
  disabled = false,
  className = '',
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [actualPosition, setActualPosition] = useState(position);
  const [isMounted, setIsMounted] = useState(false);

  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle client-side mounting for portal
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    let finalPosition = position;

    // Calculate position based on desired position
    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - OFFSET;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        // Flip to bottom if not enough space
        if (top < 0) {
          top = triggerRect.bottom + OFFSET;
          finalPosition = 'bottom';
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + OFFSET;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        // Flip to top if not enough space
        if (top + tooltipRect.height > viewportHeight) {
          top = triggerRect.top - tooltipRect.height - OFFSET;
          finalPosition = 'top';
        }
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - OFFSET;
        // Flip to right if not enough space
        if (left < 0) {
          left = triggerRect.right + OFFSET;
          finalPosition = 'right';
        }
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + OFFSET;
        // Flip to left if not enough space
        if (left + tooltipRect.width > viewportWidth) {
          left = triggerRect.left - tooltipRect.width - OFFSET;
          finalPosition = 'left';
        }
        break;
    }

    // Clamp to viewport bounds
    left = Math.max(8, Math.min(left, viewportWidth - tooltipRect.width - 8));
    top = Math.max(8, Math.min(top, viewportHeight - tooltipRect.height - 8));

    setTooltipPosition({ top, left });
    setActualPosition(finalPosition);
  }, [position]);

  const handleMouseEnter = useCallback(() => {
    if (disabled) return;

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      // Calculate position after render
      requestAnimationFrame(() => {
        calculatePosition();
      });
    }, delay);
  }, [disabled, delay, calculatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Recalculate position when visible
  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, calculatePosition]);

  // Arrow styles based on position
  const arrowStyles: Record<TooltipPosition, string> = {
    top: 'bottom-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
    bottom: 'top-[-6px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
    left: 'right-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
    right: 'left-[-6px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  };

  const tooltipContent = isVisible && isMounted ? (
    createPortal(
      <div
        ref={tooltipRef}
        className={`
          fixed z-[100] pointer-events-none
          transition-opacity duration-150
          ${isVisible ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          maxWidth,
        }}
        role="tooltip"
      >
        <div
          className={`
            bg-gray-800 text-white text-sm rounded-lg shadow-xl
            border border-gray-700
            px-3 py-2
            ${className}
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-0 h-0
              border-[6px] border-solid
              ${arrowStyles[actualPosition]}
            `}
          />
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      {tooltipContent}
    </>
  );
}

/**
 * Helper component for formatted tooltip content
 */
export function TooltipContent({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      {title && (
        <div className="font-semibold text-yellow-400">{title}</div>
      )}
      <div className="text-gray-300 text-xs leading-relaxed">{children}</div>
    </div>
  );
}
