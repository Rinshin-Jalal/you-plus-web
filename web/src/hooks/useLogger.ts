'use client';

import * as Sentry from '@sentry/nextjs';
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
  /** Capture an exception to Sentry with optional context */
  captureException: (error: Error, context?: LogContext) => void;
  /** Add a breadcrumb for debugging */
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

  // Send to Sentry for warn and error levels (or all in development)
  if (level === 'warn' || level === 'error') {
    Sentry.addBreadcrumb({
      category: component || 'app',
      message,
      level: severityMap[level],
      data: fullContext,
    });
  }
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
      
      // Also capture exceptions for Error objects
      if (message instanceof Error) {
        Sentry.captureException(message, {
          extra: { component, ...context },
        });
      }
    },
    captureException: (error: Error, context?: LogContext) => {
      log('error', error.message, context, component);
      Sentry.captureException(error, {
        extra: { component, ...context },
      });
    },
    breadcrumb: (message: string, category?: string, data?: LogContext) => {
      Sentry.addBreadcrumb({
        category: category || component,
        message,
        level: 'info',
        data,
      });
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

      if (message instanceof Error) {
        Sentry.captureException(message, {
          extra: { component: componentName, ...context },
        });
      }
    },
    [componentName]
  );

  const captureException = useCallback(
    (err: Error, context?: LogContext) => {
      log('error', err.message, context, componentName);
      Sentry.captureException(err, {
        extra: { component: componentName, ...context },
      });
    },
    [componentName]
  );

  const breadcrumb = useCallback(
    (message: string, category?: string, data?: LogContext) => {
      Sentry.addBreadcrumb({
        category: category || componentName,
        message,
        level: 'info',
        data,
      });
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
