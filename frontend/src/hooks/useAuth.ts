/**
 * useAuth Hook
 * 
 * The main authentication hook used throughout the frontend.
 * Provides login, register, logout functions and current user state.
 * 
 * Usage:
 *   const { user, isLoading, login, register, logout } = useAuth();
 * 
 * How it works:
 *   1. On mount: listens to Supabase auth state changes
 *   2. When session changes: updates Zustand store
 *   3. login/register: calls Supabase Auth directly
 *   4. logout: clears session and store
 * 
 * Why Supabase Auth directly?
 *   - Supabase Auth is designed to be called from the client
 *   - It handles token storage, refresh, and session management
 *   - The JWT tokens it produces are what our backend verifies
 */

'use client';

import { useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore, User } from '@/store/authStore';
import { useRouter } from 'next/navigation';

// ──────────────────────────────────────────────
// Auth Error Type
// ──────────────────────────────────────────────

interface AuthError {
  message: string;
}

// ──────────────────────────────────────────────
// Hook
// ──────────────────────────────────────────────

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isLoading,
    isAuthenticating,
    error,
    setUser,
    setLoading,
    setAuthenticating,
    setError,
    clearAuth,
  } = useAuthStore();

  // ──────────────────────────────────────────────
  // Listen to Supabase auth state changes
  // ──────────────────────────────────────────────

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at || '',
        });
      }
      setLoading(false);
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || '',
          });
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            created_at: session.user.created_at || '',
          });
        } else if (event === 'INITIAL_SESSION') {
          setLoading(false);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setLoading, clearAuth]);

  // ──────────────────────────────────────────────
  // Login
  // ──────────────────────────────────────────────

  const login = useCallback(async (email: string, password: string) => {
    setAuthenticating(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || '',
        });
        router.push('/dashboard');
        return { success: true };
      }

      setError('Login failed. Please try again.');
      return { success: false, error: 'Login failed' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      return { success: false, error: message };
    } finally {
      setAuthenticating(false);
    }
  }, [setAuthenticating, setError, setUser, router]);

  // ──────────────────────────────────────────────
  // Register
  // ──────────────────────────────────────────────

  const register = useCallback(async (email: string, password: string) => {
    setAuthenticating(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return { success: false, error: authError.message };
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        return {
          success: true,
          needsConfirmation: true,
          message: 'Check your email to confirm your account.',
        };
      }

      // If auto-confirmed (no email confirmation required)
      if (data.session && data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          created_at: data.user.created_at || '',
        });
        router.push('/dashboard');
        return { success: true };
      }

      return { success: false, error: 'Registration failed. Please try again.' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      return { success: false, error: message };
    } finally {
      setAuthenticating(false);
    }
  }, [setAuthenticating, setError, setUser, router]);

  // ──────────────────────────────────────────────
  // Logout
  // ──────────────────────────────────────────────

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
      clearAuth();
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
      // Force clear even if API call fails
      clearAuth();
      router.push('/login');
    }
  }, [clearAuth, router]);

  // ──────────────────────────────────────────────
  // Return
  // ──────────────────────────────────────────────

  return {
    /** Currently authenticated user (null if not logged in) */
    user,

    /** True while determining initial auth state */
    isLoading,

    /** True while login/register is in progress */
    isAuthenticating,

    /** Error message from last failed auth action */
    error,

    /** Whether user is authenticated */
    isAuthenticated: !!user,

    /** Sign in with email and password */
    login,

    /** Create a new account */
    register,

    /** Sign out and redirect to login */
    logout,
  };
}
