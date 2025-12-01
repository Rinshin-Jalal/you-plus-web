/**
 * API Client Service
 * Provides fetch wrapper with token management, error handling, and automatic retries
 */

import { supabase } from './supabase';

// Environment-based base URL with fallback
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

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
    public response?: ApiError
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

class ApiClient {
  private baseUrl: string;
  private refreshPromise: Promise<string | null> | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get fresh access token from Supabase session
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Refresh access token (prevents multiple simultaneous refresh attempts)
   */
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
   * Main request method with automatic token refresh on 401
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Get token from Supabase session
    const token = await this.getAccessToken();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 with token refresh (retry once)
      if (response.status === 401 && retryCount === 0) {
        console.warn('Token expired, attempting refresh...');
        const newToken = await this.refreshAccessToken();
        
        if (newToken) {
          // Retry request with new token
          return this.request<T>(endpoint, options, retryCount + 1);
        } else {
          // Refresh failed - redirect to login
          console.error('Token refresh failed, redirecting to login');
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
          throw new ApiClientError(401, 'Authentication required');
        }
      }

      // Parse response body
      const contentType = response.headers.get('content-type');
      let responseData: unknown;
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      // Handle non-OK responses
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
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }

      // Handle network errors
      console.error('Network error:', error);
      throw new ApiClientError(
        0,
        'Network error. Please check your connection.',
        { error: String(error), statusCode: 0 }
      );
    }
  }

  /**
   * GET request
   */
  public get<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  public post<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  /**
   * PUT request
   */
  public put<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  /**
   * DELETE request
   */
  public delete<T>(endpoint: string, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * PATCH request
   */
  public patch<T>(endpoint: string, body?: unknown, headers?: HeadersInit): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(BASE_URL);

// Export base URL for reference
export { BASE_URL };
