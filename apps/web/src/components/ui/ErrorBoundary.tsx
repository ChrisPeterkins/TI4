'use client';

import { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  /** Custom fallback UI to show on error */
  fallback?: ReactNode;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to show the retry button */
  showRetry?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * ErrorBoundary - Catches JavaScript errors in child component tree
 *
 * @example
 * ```tsx
 * <ErrorBoundary
 *   onError={(error) => logError(error)}
 *   fallback={<CustomErrorUI />}
 * >
 *   <SomeComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorMessage={this.props.errorMessage}
          showRetry={this.props.showRetry}
          onRetry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

export interface ErrorFallbackProps {
  /** The error that was caught */
  error?: Error | null;
  /** Custom error message to display */
  errorMessage?: string;
  /** Whether to show the retry button */
  showRetry?: boolean;
  /** Callback when retry is clicked */
  onRetry?: () => void;
  /** Additional class names */
  className?: string;
}

/**
 * ErrorFallback - Default error UI component
 *
 * Can be used standalone or as the default for ErrorBoundary
 */
export function ErrorFallback({
  error,
  errorMessage = 'Something went wrong',
  showRetry = true,
  onRetry,
  className,
}: ErrorFallbackProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center ${className || ''}`}
      role="alert"
    >
      <div className="w-16 h-16 mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
        <svg
          className="w-8 h-8 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2 className="text-xl font-semibold text-white mb-2">
        {errorMessage}
      </h2>

      {error && process.env.NODE_ENV === 'development' && (
        <div className="max-w-md mb-4">
          <p className="text-sm text-gray-400 mb-2">
            {error.message}
          </p>
          <details className="text-left">
            <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400">
              View stack trace
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-32 p-2 bg-gray-800 rounded">
              {error.stack}
            </pre>
          </details>
        </div>
      )}

      {!error && (
        <p className="text-gray-400 mb-4 max-w-md">
          An unexpected error occurred. Please try again or refresh the page.
        </p>
      )}

      <div className="flex gap-3">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
}

/**
 * ErrorMessage - Simple inline error message
 */
export function ErrorMessage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-2 text-red-400 text-sm ${className || ''}`}
      role="alert"
    >
      <svg
        className="w-4 h-4 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/**
 * ErrorCard - Card-style error display
 */
export function ErrorCard({
  title = 'Error',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-red-500/30 bg-red-500/10 p-4 ${className || ''}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div className="flex-1">
          <h3 className="text-red-400 font-medium">{title}</h3>
          <p className="text-red-300/80 text-sm mt-1">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm text-red-400 hover:text-red-300 underline"
            >
              Try again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
