/**
 * Supabase Database Client
 * 
 * Creates and exports the Supabase service_role client for database operations.
 * This client bypasses RLS and has full access to all tables.
 * 
 * SECURITY:
 * - This file is ONLY used server-side
 * - The service_role key is NEVER exposed to the frontend
 * - All database operations go through this client
 * 
 * Usage in repositories:
 *   import { supabaseAdmin } from '@lib/supabase';
 *   const { data } = await supabaseAdmin.from('strategies').select('*');
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '@config/index';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// Singleton Database Client
// ──────────────────────────────────────────────

let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Get the Supabase admin client (service_role).
 * Singleton — created once and reused for all database operations.
 * 
 * Throws if Supabase credentials are not configured.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      '❌ Supabase database client not configured.\n' +
      '   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
  }

  _supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      // Global fetch options
      global: {
        headers: {
          'x-client-info': 'ai-trading-platform/1.0.0',
        },
      },
    }
  );

  logger.info('Supabase database client initialized', {
    url: config.supabase.url.replace(/\/\/.*\.supabase\.co/, '//***.supabase.co'),
  });

  return _supabaseAdmin;
}

/**
 * Convenience export — the admin client instance.
 * Use this in repository files.
 */
export const supabaseAdmin = {
  get client(): SupabaseClient {
    return getSupabaseAdmin();
  },
};

/**
 * Check if the database connection is working.
 * Used for health checks.
 */
export async function checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getSupabaseAdmin();
    const { error } = await client.from('user_preferences').select('id').limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
