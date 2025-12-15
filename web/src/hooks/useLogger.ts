'use client';

import posthog from 'posthog-js';
import { useCallback, useMemo } from 'react';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface Logger {
  debug: (message: string, context?: LogContext) => void;
  info: (message: string, context?: LogContext) => void;
  warn: (message: string, context?: LogContext) => void;
  error: (message: string | Error, context?: LogContext) => void;
  /** Capture an exception to PostHog with optional context */
  captureException: (error: Error, context?: LogContext) => void;
  /** Log a breadcrumb (console only - PostHog auto-captures exceptions) */
  breadcrumb: (message: string, category?: string, data?: LogContext) => void;
}

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Map log levels to Sentry severity
const severityMap: Record<LogLevel, 'debug' | 'info' | 'warning' | 'error'> = {
  debug: 'debug',
  info: 'info',
  warn: 'warning',
  error: 'error',
};

/**
 * Format log message with timestamp and context
 */
function formatLogMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = context ? ` ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, component?: string): void {
  const fullContext = component ? { component, ...context } : context;
  
  // Always log to console in development
  if (isDevelopment) {
    const formattedMessage = formatLogMessage(level, message, fullContext);
    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        break;
    }
  }

  // PostHog auto-captures exceptions via __enable_exception_autocapture
  // No need to manually track breadcrumbs - they're part of session replay
}

/**
 * Create a logger instance for a specific component
 */
export function createLogger(component: string): Logger {
  return {
    debug: (message: string, context?: LogContext) => {
      log('debug', message, context, component);
    },
    info: (message: string, context?: LogContext) => {
      log('info', message, context, component);
    },
    warn: (message: string, context?: LogContext) => {
      log('warn', message, context, component);
    },
    error: (message: string | Error, context?: LogContext) => {
      const errorMessage = message instanceof Error ? message.message : message;
      log('error', errorMessage, context, component);
      
      // Capture exceptions in PostHog
      if (message instanceof Error && typeof window !== 'undefined') {
        posthog.captureException(message, {
          extra: { component, ...context },
        });
      }
    },
    captureException: (error: Error, context?: LogContext) => {
      log('error', error.message, context, component);
      if (typeof window !== 'undefined') {
        posthog.captureException(error, {
          extra: { component, ...context },
        });
      }
    },
    breadcrumb: (message: string, category?: string, data?: LogContext) => {
      // PostHog auto-captures via session replay - just log to console
      if (isDevelopment) {
        console.debug(`[${category || component}]`, message, data);
      }
    },
  };
}

/**
 * React hook for logging within components
 * 
 * @param componentName - Name of the component for log context
 * @returns Logger instance with debug, info, warn, error methods
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const logger = useLogger('MyComponent');
 *   
 *   useEffect(() => {
 *     logger.info('Component mounted');
 *     return () => logger.info('Component unmounted');
 *   }, []);
 *   
 *   const handleError = (error: Error) => {
 *     logger.error(error, { action: 'handleSubmit' });
 *   };
 * }
 * ```
 */
export function useLogger(componentName: string): Logger {
  const debug = useCallback(
    (message: string, context?: LogContext) => {
      log('debug', message, context, componentName);
    },
    [componentName]
  );

  const info = useCallback(
    (message: string, context?: LogContext) => {
      log('info', message, context, componentName);
    },
    [componentName]
  );

  const warn = useCallback(
    (message: string, context?: LogContext) => {
      log('warn', message, context, componentName);
    },
    [componentName]
  );

  const error = useCallback(
    (message: string | Error, context?: LogContext) => {
      const errorMessage = message instanceof Error ? message.message : message;
      log('error', errorMessage, context, componentName);

      if (message instanceof Error && typeof window !== 'undefined') {
        posthog.captureException(message, {
          extra: { component: componentName, ...context },
        });
      }
    },
    [componentName]
  );

  const captureException = useCallback(
    (err: Error, context?: LogContext) => {
      log('error', err.message, context, componentName);
      if (typeof window !== 'undefined') {
        posthog.captureException(err, {
          extra: { component: componentName, ...context },
        });
      }
    },
    [componentName]
  );

  const breadcrumb = useCallback(
    (message: string, category?: string, data?: LogContext) => {
      // PostHog auto-captures via session replay - just log to console
      if (isDevelopment) {
        console.debug(`[${category || componentName}]`, message, data);
      }
    },
    [componentName]
  );

  return useMemo(
    () => ({
      debug,
      info,
      warn,
      error,
      captureException,
      breadcrumb,
    }),
    [debug, info, warn, error, captureException, breadcrumb]
  );
}

// Default logger for non-component code
export const logger = createLogger('app');
