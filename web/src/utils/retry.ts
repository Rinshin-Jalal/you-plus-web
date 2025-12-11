/**
 * Retry utilities with exponential backoff
 */

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxAttempts?: number;
  /** Initial delay in milliseconds */
  initialDelay?: number;
  /** Maximum delay in milliseconds */
  maxDelay?: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable */
  isRetryable?: (error: unknown) => boolean;
  /** Callback for each retry attempt */
  onRetry?: (attempt: number, error: unknown, nextDelay: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry'>> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  isRetryable: () => true,
};

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const clampedDelay = Math.min(exponentialDelay, maxDelay);
  // Add jitter (0-25% random variance) to prevent thundering herd
  const jitter = clampedDelay * 0.25 * Math.random();
  return Math.floor(clampedDelay + jitter);
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a function with automatic retry and exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const isLastAttempt = attempt === opts.maxAttempts;
      const shouldRetry = opts.isRetryable(error);

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      // Calculate delay for next attempt
      const delay = calculateBackoffDelay(
        attempt,
        opts.initialDelay,
        opts.maxDelay,
        opts.backoffMultiplier
      );

      // Notify about retry
      opts.onRetry?.(attempt, error, delay);

      // Wait before retrying
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Check if browser is online
 */
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

/**
 * Wait for network to come back online
 */
export function waitForOnline(timeoutMs = 30000): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || navigator.onLine) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', onOnline);
      resolve(false);
    }, timeoutMs);

    const onOnline = () => {
      clearTimeout(timeoutId);
      resolve(true);
    };

    window.addEventListener('online', onOnline, { once: true });
  });
}

/**
 * Format retry countdown for display
 */
export function formatCountdown(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds <= 1) return '1 second';
  return `${seconds} seconds`;
}

export type RetryState = {
  isRetrying: boolean;
  attempt: number;
  maxAttempts: number;
  nextRetryIn: number | null;
  error: string | null;
  isOffline: boolean;
};
