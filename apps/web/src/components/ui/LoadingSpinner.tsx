'use client';

// Simple className joiner utility
function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Color variant */
  variant?: 'default' | 'primary' | 'white';
  /** Additional class names */
  className?: string;
  /** Screen reader label */
  label?: string;
}

const SIZE_CLASSES = {
  xs: 'w-3 h-3 border-[1.5px]',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-[3px]',
  xl: 'w-12 h-12 border-4',
};

const VARIANT_CLASSES = {
  default: 'border-gray-600 border-t-gray-300',
  primary: 'border-blue-900 border-t-blue-400',
  white: 'border-white/20 border-t-white',
};

/**
 * LoadingSpinner - A simple, accessible loading spinner
 *
 * @example
 * ```tsx
 * // Basic usage
 * <LoadingSpinner />
 *
 * // With size and variant
 * <LoadingSpinner size="lg" variant="primary" />
 *
 * // In a button
 * <button disabled={isLoading}>
 *   {isLoading ? <LoadingSpinner size="sm" variant="white" /> : 'Submit'}
 * </button>
 * ```
 */
export function LoadingSpinner({
  size = 'md',
  variant = 'default',
  className,
  label = 'Loading...',
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        'inline-block animate-spin rounded-full',
        SIZE_CLASSES[size],
        VARIANT_CLASSES[variant],
        className
      )}
    >
      <span className="sr-only">{label}</span>
    </div>
  );
}

export interface LoadingOverlayProps {
  /** Whether the overlay is visible */
  show: boolean;
  /** Loading message to display */
  message?: string;
  /** Whether to blur the background */
  blur?: boolean;
  /** Spinner size */
  size?: LoadingSpinnerProps['size'];
}

/**
 * LoadingOverlay - Full-screen loading overlay with spinner
 *
 * @example
 * ```tsx
 * <LoadingOverlay show={isLoading} message="Saving changes..." />
 * ```
 */
export function LoadingOverlay({
  show,
  message = 'Loading...',
  blur = true,
  size = 'lg',
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70',
        blur && 'backdrop-blur-sm'
      )}
      role="progressbar"
      aria-busy="true"
      aria-label={message}
    >
      <LoadingSpinner size={size} variant="primary" />
      {message && (
        <p className="mt-4 text-gray-300 text-sm">{message}</p>
      )}
    </div>
  );
}

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Spinner size */
  spinnerSize?: LoadingSpinnerProps['size'];
  /** Content to display when not loading */
  children: React.ReactNode;
}

/**
 * LoadingButton - Button with integrated loading state
 *
 * @example
 * ```tsx
 * <LoadingButton loading={isSubmitting} loadingText="Saving...">
 *   Save Changes
 * </LoadingButton>
 * ```
 */
export function LoadingButton({
  loading = false,
  loadingText,
  spinnerSize = 'sm',
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      {...props}
    >
      {loading && <LoadingSpinner size={spinnerSize} variant="white" />}
      <span>{loading && loadingText ? loadingText : children}</span>
    </button>
  );
}

export interface InlineLoadingProps {
  /** Loading message */
  message?: string;
  /** Size of the spinner */
  size?: LoadingSpinnerProps['size'];
  /** Additional class names */
  className?: string;
}

/**
 * InlineLoading - Inline loading indicator with message
 *
 * @example
 * ```tsx
 * {isLoading ? (
 *   <InlineLoading message="Fetching data..." />
 * ) : (
 *   <DataTable data={data} />
 * )}
 * ```
 */
export function InlineLoading({
  message = 'Loading...',
  size = 'sm',
  className,
}: InlineLoadingProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 text-gray-400 text-sm',
        className
      )}
      role="status"
    >
      <LoadingSpinner size={size} variant="default" />
      <span>{message}</span>
    </div>
  );
}
