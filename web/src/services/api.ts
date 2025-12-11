import { supabase } from './supabase';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Default timeout for API requests (30 seconds)
const DEFAULT_TIMEOUT_MS = 30000;

// Timeout for billing/payment operations (45 seconds - longer due to external API calls)
const BILLING_TIMEOUT_MS = 45000;

export interface ApiError {
  error: string;
  statusCode: number;
  timestamp?: string;
  details?: unknown;
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeoutMs = this.getTimeoutForEndpoint(endpoint);
    
    const token = await this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const config: RequestInit = {
      ...options,
      headers,
      signal: controller.signal,
    };

    try {
      const response = await fetch(url, config);

      if (response.status === 401 && retryCount === 0) {
        console.warn('Token expired, attempting refresh...');
        const newToken = await this.refreshAccessToken();
        
        if (newToken) {
          return this.request<T>(endpoint, options, retryCount + 1);
        } else {
          console.error('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          throw new ApiClientError(401, 'Authentication required');
        }
      }

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
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ApiClientError(
          0,
          `Request timed out after ${timeoutMs}ms`,
          { error: 'Request timeout', statusCode: 0 },
          true, // isTimeout
          false
        );
      }

      if (error instanceof ApiClientError) {
        throw error;
      }

      // Network errors
      console.error('Network error:', error);
      throw new ApiClientError(
        0,
        'Network error. Please check your connection.',
        { error: String(error), statusCode: 0 },
        false,
        true // isNetworkError
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  public post<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public put<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  public delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  public patch<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }
}

export const apiClient = new ApiClient(BASE_URL);
export { BASE_URL };
