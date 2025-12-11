import { supabase } from './supabase';
import { calculateBackoffDelay, sleep } from '@/utils/retry';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

// Timeout for billing/payment operations (45 seconds - longer due to external API calls)
const BILLING_TIMEOUT_MS = 45000;

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export interface ApiError {
  error: string;
  statusCode: number;
  timestamp?: string;
  details?: unknown;
}

export interface RequestOptions extends RequestInit {
  /** Disable automatic retry for this request */
  disableRetry?: boolean;
  /** Custom retry configuration */
  retry?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
  };
}

export class ApiClientError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public response?: ApiError,
    public isTimeout: boolean = false,
    public isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiClientError';
  }

  /** Whether the error is likely temporary and the request can be retried */
  get isRetryable(): boolean {
    if (this.isTimeout || this.isNetworkError) return true;
    if (this.statusCode === 429) return true; // Rate limited
    if (this.statusCode >= 500 && this.statusCode < 600) return true; // Server errors
    return false;
  }

  /** User-friendly error message */
  get userMessage(): string {
    if (this.isTimeout) return 'The request took too long. Please try again.';
    if (this.isNetworkError) return 'Unable to connect. Please check your connection.';
    if (this.statusCode === 429) return 'Too many requests. Please wait a moment.';
    if (this.statusCode >= 500) return 'Service temporarily unavailable. Please try again.';
    if (this.statusCode === 401) return 'Please sign in again.';
    if (this.statusCode === 403) return 'You do not have permission to perform this action.';
    return this.response?.error || 'Something went wrong. Please try again.';
  }
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error || !session) {
          console.error('Token refresh failed:', error?.message);
          return null;
        }
        return session.access_token;
      } catch (error) {
        console.error('Unexpected error refreshing token:', error);
        return null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Determine timeout based on endpoint
   */
  private getTimeoutForEndpoint(endpoint: string): number {
    // Billing endpoints need longer timeout due to external payment API calls
    if (endpoint.includes('/billing') || endpoint.includes('/checkout') || endpoint.includes('/subscription')) {
      return BILLING_TIMEOUT_MS;
    }
    return DEFAULT_TIMEOUT_MS;
  }

  /**
   * Check if request method is idempotent and safe to retry
   */
  private isIdempotentMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'].includes(method.toUpperCase());
  }

  /**
   * Execute a single request attempt
   */
  private async executeRequest<T>(
    url: string,
    config: RequestInit,
    timeoutMs: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      const contentType = response.headers.get('content-type');
      let responseData: unknown;

      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        const error = responseData as ApiError;
        throw new ApiClientError(
          response.status,
          error.error || `API Error: ${response.statusText}`,
          error
        );
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(
          0,
          `Request timed out after ${timeoutMs}ms`,
          { error: 'Request timeout', statusCode: 0 },
          true,
          false
        );
      }

      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new ApiClientError(
        0,
        'Network error. Please check your connection.',
        { error: String(error), statusCode: 0 },
        false,
        true
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {},
    authRetryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeoutMs = this.getTimeoutForEndpoint(endpoint);
    const method = options.method || 'GET';
    
    // Determine if we should retry
    const { disableRetry, retry: retryConfig, ...fetchOptions } = options;
    const shouldRetry = !disableRetry && this.isIdempotentMethod(method);
    const retryOpts = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
    
    const token = await this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    let lastError: ApiClientError | null = null;

    // Retry loop with exponential backoff and jitter
    for (let attempt = 1; attempt <= (shouldRetry ? retryOpts.maxAttempts : 1); attempt++) {
      try {
        const result = await this.executeRequest<T>(url, config, timeoutMs);
        return result;
      } catch (error) {
        if (!(error instanceof ApiClientError)) {
          throw error;
        }

        lastError = error;

        // Handle 401 with token refresh (only once)
        if (error.statusCode === 401 && authRetryCount === 0) {
          console.warn('Token expired, attempting refresh...');
          const newToken = await this.refreshAccessToken();

          if (newToken) {
            return this.request<T>(endpoint, options, authRetryCount + 1);
          } else {
            console.error('Token refresh failed, redirecting to login');
            if (typeof window !== 'undefined') {
              window.location.href = '/auth/login';
            }
            throw error;
          }
        }

        // Check if we should retry this error
        const isLastAttempt = attempt === retryOpts.maxAttempts;
        if (!shouldRetry || !error.isRetryable || isLastAttempt) {
          throw error;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = calculateBackoffDelay(
          attempt,
          retryOpts.initialDelay,
          retryOpts.maxDelay,
          retryOpts.backoffMultiplier
        );

        console.warn(
          `[API] Request failed (attempt ${attempt}/${retryOpts.maxAttempts}), retrying in ${delay}ms...`,
          { endpoint, error: error.message }
        );

        await sleep(delay);
      }
    }

    // Should not reach here, but just in case
    throw lastError || new ApiClientError(0, 'Unknown error');
  }

  public get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      // POST is not idempotent, so disable retry by default
      disableRetry: options?.disableRetry ?? true,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      // PATCH is not idempotent, so disable retry by default
      disableRetry: options?.disableRetry ?? true,
    });
  }
}

export const apiClient = new ApiClient(BASE_URL);
export { BASE_URL };
