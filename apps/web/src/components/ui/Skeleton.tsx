'use client';

// Simple className joiner utility
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface SkeletonProps {
  /** Additional class names */
  className?: string;
  /** Whether to show the pulse animation */
  animate?: boolean;
}

/**
 * Skeleton - Base skeleton component for loading placeholders
 *
 * @example
 * ```tsx
 * // Rectangle
 * <Skeleton className="h-4 w-full" />
 *
 * // Circle
 * <Skeleton className="h-12 w-12 rounded-full" />
 *
 * // Card
 * <Skeleton className="h-32 w-full rounded-lg" />
 * ```
 */
export function Skeleton({ className, animate = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-700/50 rounded',
        animate && 'animate-pulse',
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonText - Text placeholder skeleton
 */
export function SkeletonText({
  lines = 1,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonCard - Card-shaped skeleton placeholder
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-700/50 bg-gray-800/50 p-4',
        className
      )}
    >
      <Skeleton className="h-4 w-3/4 mb-3" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

/**
 * SkeletonAvatar - Avatar/profile picture skeleton
 */
export function SkeletonAvatar({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
  };

  return (
    <Skeleton
      className={cn('rounded-full', sizeClasses[size], className)}
    />
  );
}

/**
 * SkeletonButton - Button-shaped skeleton
 */
export function SkeletonButton({
  size = 'md',
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-8 w-20',
    md: 'h-10 w-24',
    lg: 'h-12 w-32',
  };

  return (
    <Skeleton
      className={cn('rounded-md', sizeClasses[size], className)}
    />
  );
}

/**
 * SkeletonTable - Table skeleton with rows
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-gray-700/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                'h-4 flex-1',
                colIndex === 0 && 'w-1/4 flex-none'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonList - List of items skeleton
 */
export function SkeletonList({
  items = 3,
  showAvatar = false,
  className,
}: {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {showAvatar && <SkeletonAvatar size="sm" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * SkeletonPlayerCard - Player info card skeleton for game UI
 */
export function SkeletonPlayerCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-700/50 bg-gray-800/50 p-3',
        className
      )}
    >
      <div className="flex items-center gap-3 mb-3">
        <SkeletonAvatar size="md" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-6 rounded" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
        <Skeleton className="h-5 w-12 rounded" />
      </div>
    </div>
  );
}

/**
 * SkeletonGameCard - Action/objective card skeleton
 */
export function SkeletonGameCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-700/50 bg-gray-800/50 overflow-hidden',
        className
      )}
    >
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="p-3">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/**
 * SkeletonLobbyRow - Lobby list item skeleton
 */
export function SkeletonLobbyRow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-lg border border-gray-700/50 bg-gray-800/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonAvatar key={i} size="sm" />
          ))}
        </div>
        <SkeletonButton size="sm" />
      </div>
    </div>
  );
}

/**
 * SkeletonLobbyList - Full lobby list skeleton
 */
export function SkeletonLobbyList({
  items = 4,
  className,
}: {
  items?: number;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonLobbyRow key={i} />
      ))}
    </div>
  );
}
