/**
 * Auth Store (Zustand)
 * 
 * Client-side authentication state management.
 * Tracks whether the user is logged in, their profile, and loading states.
 * 
 * This store is updated by:
 * - useAuth hook (login, register, logout)
 * - Supabase auth state listener (session changes)
 * 
 * This store is read by:
 * - AuthGuard component (decides whether to show content or redirect)
 * - Dashboard layout (shows user info in header)
 * - Any component that needs to know auth state
 */

import { create } from 'zustand';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  created_at: string;
}

interface AuthState {
  /** The currently authenticated user (null if not logged in) */
  user: User | null;

  /** Whether the auth state is being determined (initial load) */
  isLoading: boolean;

  /** Whether an auth action is in progress (login, register, etc.) */
  isAuthenticating: boolean;

  /** Error message from the last failed auth action */
  error: string | null;

  // ─── Actions ───

  /** Set the user (called when session is established) */
  setUser: (user: User | null) => void;

  /** Set loading state */
  setLoading: (isLoading: boolean) => void;

  /** Set authenticating state */
  setAuthenticating: (isAuthenticating: boolean) => void;

  /** Set error message */
  setError: (error: string | null) => void;

  /** Clear all auth state (called on logout) */
  clearAuth: () => void;
}

// ──────────────────────────────────────────────
// Store
// ──────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  user: null,
  isLoading: true, // Start as loading — we don't know auth state yet
  isAuthenticating: false,
  error: null,

  // Actions
  setUser: (user) => set({ user, error: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setAuthenticating: (isAuthenticating) => set({ isAuthenticating }),

  setError: (error) => set({ error, isAuthenticating: false }),

  clearAuth: () => set({
    user: null,
    isLoading: false,
    isAuthenticating: false,
    error: null,
  }),
}));
