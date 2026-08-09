/**
 * Supabase Client Configuration
 * 
 * Creates and exports the Supabase browser client.
 * This uses ONLY the anon key (public) — never the service role key.
 * 
 * All sensitive operations go through the backend API.
 * The frontend Supabase client is used ONLY for:
 *   - Authentication (login/signup)
 *   - Real-time subscriptions
 *   - Public data reads
 * 
 * IMPORTANT: Client is lazy-initialized to avoid build-time errors
 * when environment variables are not set.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 🔴 These values come from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Supabase browser client instance.
 * Lazy-initialized — only created when first accessed.
 * This prevents build-time errors when env vars are missing.
 */
let _supabase: SupabaseClient | null = null;

/**
 * Get the Supabase client instance.
 * Creates it on first call, reuses it afterwards.
 * 
 * Returns a mock-safe client even if env vars are missing
 * (will warn in console but won't crash the build).
 */
function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase;

  // Use fallback values during build — actual auth won't work
  // but the app will build without errors
  const url = supabaseUrl || 'https://placeholder.supabase.co';
  const key = supabaseAnonKey || 'placeholder-key';

  if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_ID')) {
    if (typeof window !== 'undefined') {
      console.warn(
        '⚠️  Supabase URL not configured. Set NEXT_PUBLIC_SUPABASE_URL in frontend/.env.local'
      );
    }
  }

  if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-public-key-here') {
    if (typeof window !== 'undefined') {
      console.warn(
        '⚠️  Supabase anon key not configured. Set NEXT_PUBLIC_SUPABASE_ANON_KEY in frontend/.env.local'
      );
    }
  }

  _supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return _supabase;
}

/**
 * Supabase client proxy.
 * Use this throughout the app instead of importing createClient directly.
 */
export const supabase = {
  auth: {
    getSession: () => getSupabaseClient().auth.getSession(),
    signInWithPassword: (credentials: { email: string; password: string }) =>
      getSupabaseClient().auth.signInWithPassword(credentials),
    signUp: (credentials: { email: string; password: string }) =>
      getSupabaseClient().auth.signUp(credentials),
    signOut: () => getSupabaseClient().auth.signOut(),
    onAuthStateChange: (callback: Parameters<SupabaseClient['auth']['onAuthStateChange']>[0]) =>
      getSupabaseClient().auth.onAuthStateChange(callback),
    getUser: (token: string) => getSupabaseClient().auth.getUser(token),
  },
};

/** Access the raw Supabase client (for advanced use cases) */
export const getSupabase = getSupabaseClient;
