'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  withRetry,
  RetryOptions,
  RetryState,
  calculateBackoffDelay,
  isOnline,
  waitForOnline,
} from '@/utils/retry';

export interface UseRetryOptions extends RetryOptions {
  /** Auto-retry when coming back online */
  retryOnReconnect?: boolean;
}

export interface UseRetryReturn<T> {
  /** Execute the function with retry logic */
  execute: () => Promise<T | null>;
  /** Current retry state */
  state: RetryState;
  /** Reset the retry state */
  reset: () => void;
  /** Manually trigger a retry */
  retry: () => Promise<T | null>;
  /** Cancel any pending retry */
  cancel: () => void;
}

const INITIAL_STATE: RetryState = {
  isRetrying: false,
  attempt: 0,
  maxAttempts: 3,
  nextRetryIn: null,
  error: null,
  isOffline: false,
};

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
): UseRetryReturn<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    isRetryable = () => true,
    retryOnReconnect = true,
    onRetry,
  } = options;

  const [state, setState] = useState<RetryState>({
    ...INITIAL_STATE,
    maxAttempts,
    isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
  });

  const cancelRef = useRef(false);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Cancel pending operations
  const cancel = useCallback(() => {
    cancelRef.current = true;
    clearTimers();
    setState(prev => ({
      ...prev,
      isRetrying: false,
      nextRetryIn: null,
    }));
  }, [clearTimers]);

  // Reset state
  const reset = useCallback(() => {
    cancelRef.current = false;
    clearTimers();
    setState({
      ...INITIAL_STATE,
      maxAttempts,
      isOffline: typeof window !== 'undefined' ? !navigator.onLine : false,
    });
  }, [clearTimers, maxAttempts]);

  // Main execute function
  const execute = useCallback(async (): Promise<T | null> => {
    cancelRef.current = false;
    clearTimers();

    setState(prev => ({
      ...prev,
      isRetrying: true,
      attempt: 1,
      error: null,
      nextRetryIn: null,
    }));

    try {
      const result = await withRetry(fn, {
        maxAttempts,
        initialDelay,
        maxDelay,
        backoffMultiplier,
        isRetryable: (error) => {
          if (cancelRef.current) return false;
          return isRetryable(error);
        },
        onRetry: (attempt, error, nextDelay) => {
          if (cancelRef.current) return;

          // Update state for UI
          setState(prev => ({
            ...prev,
            attempt: attempt + 1,
            nextRetryIn: nextDelay,
            error: error instanceof Error ? error.message : 'An error occurred',
          }));

          // Start countdown
          const startTime = Date.now();
          countdownIntervalRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, nextDelay - elapsed);
            
            if (remaining <= 0 || cancelRef.current) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
                countdownIntervalRef.current = null;
              }
            } else {
              setState(prev => ({ ...prev, nextRetryIn: remaining }));
            }
          }, 100);

          onRetry?.(attempt, error, nextDelay);
        },
      });

      setState(prev => ({
        ...prev,
        isRetrying: false,
        error: null,
        nextRetryIn: null,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      
      setState(prev => ({
        ...prev,
        isRetrying: false,
        error: errorMessage,
        nextRetryIn: null,
      }));

      return null;
    }
  }, [fn, maxAttempts, initialDelay, maxDelay, backoffMultiplier, isRetryable, onRetry, clearTimers]);

  // Retry function (same as execute but explicitly for retry)
  const retry = useCallback(() => {
    reset();
    return execute();
  }, [reset, execute]);

  // Monitor online status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOffline: false }));
      
      // Auto-retry if enabled and there was an error
      if (retryOnReconnect && state.error && !state.isRetrying) {
        retry();
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOffline: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [retryOnReconnect, state.error, state.isRetrying, retry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    execute,
    state,
    reset,
    retry,
    cancel,
  };
}
