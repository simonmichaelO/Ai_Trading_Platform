/**
 * User Repository
 * 
 * Database access layer for user-related operations.
 * Uses Supabase service_role client for full database access.
 * 
 * This is the ONLY layer that talks to the database for user data.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '@config/index';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// Supabase Admin Client (service_role)
// ──────────────────────────────────────────────

/**
 * Service role client — has full database access, bypassing RLS.
 * 
 * SECURITY: This is NEVER exposed to the frontend.
 * It's only used server-side for operations that need admin access.
 */
let supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      throw new Error(
        'Supabase admin client not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env'
      );
    }
    supabaseAdmin = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return supabaseAdmin;
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
}

// ──────────────────────────────────────────────
// Repository Functions
// ──────────────────────────────────────────────

/**
 * Get a user's profile by their Supabase Auth ID.
 */
export async function getUserById(userId: string): Promise<UserProfile | null> {
  try {
    const admin = getSupabaseAdmin();

    // Get user from Supabase Auth
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);

    if (authError || !authUser) {
      logger.warn('User not found in Supabase Auth', { userId, error: authError?.message });
      return null;
    }

    return {
      id: authUser.user.id,
      email: authUser.user.email || '',
      created_at: authUser.user.created_at || '',
      last_sign_in_at: authUser.user.last_sign_in_at || undefined,
    };
  } catch (error) {
    logger.error('Failed to get user by ID', { userId, error });
    return null;
  }
}

/**
 * Ensure a user_preferences row exists for this user.
 * Creates default preferences if they don't exist yet.
 */
export async function ensureUserPreferences(userId: string): Promise<void> {
  try {
    const admin = getSupabaseAdmin();

    // Check if preferences already exist
    const { data: existing } = await admin
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!existing) {
      // Create default preferences
      const { error } = await admin
        .from('user_preferences')
        .insert({
          user_id: userId,
          theme: 'dark',
          default_timeframe: '4h',
          default_market_type: 'forex',
          preferred_ai_provider: 'openai',
          preferred_ai_model: 'gpt-4o',
          default_risk_percent: 1.0,
          default_rr_ratio: 2.0,
        });

      if (error) {
        logger.warn('Failed to create default user preferences', { userId, error: error.message });
      }
    }
  } catch (error) {
    // Non-critical — log but don't fail
    logger.warn('Error ensuring user preferences', { userId, error });
  }
}
