/**
 * API Client
 * 
 * Centralized HTTP client for all backend API calls.
 * Automatically attaches the Supabase JWT token to every request.
 * 
 * Usage:
 *   import { api } from '@/lib/api';
 *   const response = await api.get('/auth/me');
 *   const response = await api.post('/analyses', { data });
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { supabase } from './supabase';

// ──────────────────────────────────────────────
// API Client Instance
// ──────────────────────────────────────────────

/**
 * Base URL:
 * - In development: uses Next.js rewrite proxy (/api → backend)
 * - In production: uses the deployed backend URL
 */
const baseURL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
  : '/api/v1';

const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 30000, // 30 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// ──────────────────────────────────────────────
// Request Interceptor — Attach JWT Token
// ──────────────────────────────────────────────

/**
 * Before every request, get the current Supabase session
 * and attach the JWT token to the Authorization header.
 * 
 * This is how the backend knows who the user is.
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Failed to attach auth token:', error);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ──────────────────────────────────────────────
// Response Interceptor — Handle Auth Errors
// ──────────────────────────────────────────────

/**
 * If the backend returns 401, the token is expired or invalid.
 * Redirect to login page.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired — redirect to login
      // Only redirect if we're not already on the login page
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// ──────────────────────────────────────────────
// Typed API helpers
// ──────────────────────────────────────────────

/** Standard API response shape */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

/**
 * GET request with typed response
 */
export async function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  const response = await apiClient.get<ApiResponse<T>>(url);
  return response.data;
}

/**
 * POST request with typed response
 */
export async function apiPost<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.post<ApiResponse<T>>(url, data);
  return response.data;
}

/**
 * PUT request with typed response
 */
export async function apiPut<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
  const response = await apiClient.put<ApiResponse<T>>(url, data);
  return response.data;
}

/**
 * DELETE request with typed response
 */
export async function apiDelete<T>(url: string): Promise<ApiResponse<T>> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data;
}

// Export the raw client for advanced use cases
export { apiClient };
export default apiClient;
