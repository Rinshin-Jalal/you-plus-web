/**
 * Retry utility with exponential backoff for external API calls.
 * 
 * Provides configurable retry logic with:
 * - Exponential backoff with jitter
 * - Configurable max retries and timeouts
 * - Safe error mapping for user-facing responses
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelayMs?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelayMs?: number;
  /** Timeout for each attempt in ms (default: 30000) */
  timeoutMs?: number;
  /** Backoff multiplier (default: 2) */
  backoffMultiplier?: number;
  /** Whether to add jitter to delays (default: true) */
  jitter?: boolean;
  /** Optional callback for logging retry attempts */
  onRetry?: (attempt: number, error: Error, nextDelayMs: number) => void;
  /** Predicate to determine if error is retryable (default: retries on network/timeout errors) */
  isRetryable?: (error: Error) => boolean;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>> = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  timeoutMs: 30000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Default retryable error check - retries on network errors, timeouts, and 5xx errors
 */
function defaultIsRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network errors
  if (message.includes('network') || message.includes('fetch')) return true;
  if (message.includes('econnrefused') || message.includes('econnreset')) return true;
  if (message.includes('timeout') || message.includes('timed out')) return true;
  if (message.includes('socket hang up')) return true;
  
  // Rate limiting
  if (message.includes('429') || message.includes('rate limit')) return true;
  
  // Server errors (5xx)
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('504')) return true;
  if (message.includes('internal server error') || message.includes('bad gateway')) return true;
  if (message.includes('service unavailable') || message.includes('gateway timeout')) return true;
  
  return false;
}

/**
 * Calculate delay with optional jitter
 */
function calculateDelay(attempt: number, options: Required<Omit<RetryOptions, 'onRetry' | 'isRetryable'>>): number {
  const exponentialDelay = options.initialDelayMs * Math.pow(options.backoffMultiplier, attempt - 1);
  const cappedDelay = Math.min(exponentialDelay, options.maxDelayMs);
  
  if (options.jitter) {
    // Add ±25% jitter
    const jitterFactor = 0.75 + Math.random() * 0.5;
    return Math.floor(cappedDelay * jitterFactor);
  }
  
  return cappedDelay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute an async function with timeout
 */
async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, operationName: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    // Create a wrapper that checks for abort
    const result = await Promise.race([
      fn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`${operationName} timed out after ${timeoutMs}ms`));
        });
      }),
    ]);
    return result;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Execute an async function with retry and exponential backoff
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => dodoClient.subscriptions.list({ customer_id: customerId }),
 *   { maxRetries: 3, timeoutMs: 15000 },
 *   'fetch subscriptions'
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
  operationName: string = 'operation'
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const isRetryable = options.isRetryable ?? defaultIsRetryable;
  
  let lastError: Error = new Error('No attempts made');
  
  for (let attempt = 1; attempt <= opts.maxRetries + 1; attempt++) {
    try {
      return await withTimeout(fn, opts.timeoutMs, operationName);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      const isLastAttempt = attempt > opts.maxRetries;
      const shouldRetry = !isLastAttempt && isRetryable(lastError);
      
      if (!shouldRetry) {
        throw lastError;
      }
      
      const delayMs = calculateDelay(attempt, opts);
      
      if (options.onRetry) {
        options.onRetry(attempt, lastError, delayMs);
      } else {
        console.warn(
          `[retry] ${operationName} failed (attempt ${attempt}/${opts.maxRetries + 1}): ${lastError.message}. ` +
          `Retrying in ${delayMs}ms...`
        );
      }
      
      await sleep(delayMs);
    }
  }
  
  throw lastError;
}

/**
 * Safe error types for user-facing responses
 */
export type SafeErrorType = 
  | 'network_error'
  | 'timeout_error'
  | 'rate_limited'
  | 'service_unavailable'
  | 'authentication_error'
  | 'validation_error'
  | 'not_found'
  | 'unknown_error';

export interface SafeError {
  type: SafeErrorType;
  message: string;
  userMessage: string;
  retryable: boolean;
}

/**
 * Map an error to a safe, user-friendly error response
 */
export function mapToSafeError(error: Error, context: string = 'request'): SafeError {
  const message = error.message.toLowerCase();
  
  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      type: 'timeout_error',
      message: error.message,
      userMessage: `The ${context} took too long. Please try again.`,
      retryable: true,
    };
  }
  
  // Network errors
  if (message.includes('network') || message.includes('fetch') || 
      message.includes('econnrefused') || message.includes('econnreset')) {
    return {
      type: 'network_error',
      message: error.message,
      userMessage: 'Unable to connect. Please check your connection and try again.',
      retryable: true,
    };
  }
  
  // Rate limiting
  if (message.includes('429') || message.includes('rate limit')) {
    return {
      type: 'rate_limited',
      message: error.message,
      userMessage: 'Too many requests. Please wait a moment and try again.',
      retryable: true,
    };
  }
  
  // Service unavailable
  if (message.includes('503') || message.includes('service unavailable') ||
      message.includes('502') || message.includes('bad gateway')) {
    return {
      type: 'service_unavailable',
      message: error.message,
      userMessage: 'Service temporarily unavailable. Please try again shortly.',
      retryable: true,
    };
  }
  
  // Authentication errors
  if (message.includes('401') || message.includes('unauthorized') ||
      message.includes('403') || message.includes('forbidden')) {
    return {
      type: 'authentication_error',
      message: error.message,
      userMessage: 'Authentication failed. Please sign in again.',
      retryable: false,
    };
  }
  
  // Validation errors
  if (message.includes('400') || message.includes('invalid') || message.includes('validation')) {
    return {
      type: 'validation_error',
      message: error.message,
      userMessage: 'Invalid request. Please check your input and try again.',
      retryable: false,
    };
  }
  
  // Not found
  if (message.includes('404') || message.includes('not found')) {
    return {
      type: 'not_found',
      message: error.message,
      userMessage: 'The requested resource was not found.',
      retryable: false,
    };
  }
  
  // Unknown/default
  return {
    type: 'unknown_error',
    message: error.message,
    userMessage: 'Something went wrong. Please try again.',
    retryable: true,
  };
}

/**
 * Convenience wrapper that returns a safe fallback on error
 * 
 * @example
 * ```typescript
 * const subscriptions = await withSafeFallback(
 *   () => dodo.getCustomerSubscriptions(customerId),
 *   [],
 *   'fetch subscriptions'
 * );
 * ```
 */
export async function withSafeFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  operationName: string = 'operation',
  options: RetryOptions = {}
): Promise<{ data: T; error?: SafeError }> {
  try {
    const data = await withRetry(fn, options, operationName);
    return { data };
  } catch (error) {
    const safeError = mapToSafeError(
      error instanceof Error ? error : new Error(String(error)),
      operationName
    );
    console.error(`[${operationName}] Failed after retries:`, safeError.message);
    return { data: fallback, error: safeError };
  }
}
