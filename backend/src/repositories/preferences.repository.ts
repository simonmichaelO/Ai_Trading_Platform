/**
 * User Preferences Repository
 * 
 * Database access layer for user settings and preferences.
 */

import { getSupabaseAdmin } from '@lib/supabase';
import { logger } from '@utils/logger';
import type { IUserPreferences, UserPreferencesUpdate } from '@models/index';

// ──────────────────────────────────────────────
// Get preferences
// ──────────────────────────────────────────────

export async function getPreferences(userId: string): Promise<IUserPreferences | null> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error('Failed to get preferences', { userId, error: error.message });
    throw new Error(`Failed to get preferences: ${error.message}`);
  }

  return data as IUserPreferences;
}

// ──────────────────────────────────────────────
// Update preferences
// ──────────────────────────────────────────────

export async function updatePreferences(
  userId: string,
  input: UserPreferencesUpdate
): Promise<IUserPreferences> {
  const db = getSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (input.theme !== undefined) updates.theme = input.theme;
  if (input.default_timeframe !== undefined) updates.default_timeframe = input.default_timeframe;
  if (input.default_market_type !== undefined) updates.default_market_type = input.default_market_type;
  if (input.preferred_ai_provider !== undefined) updates.preferred_ai_provider = input.preferred_ai_provider;
  if (input.preferred_ai_model !== undefined) updates.preferred_ai_model = input.preferred_ai_model;
  if (input.notifications !== undefined) updates.notifications = input.notifications;
  if (input.default_risk_percent !== undefined) updates.default_risk_percent = input.default_risk_percent;
  if (input.default_rr_ratio !== undefined) updates.default_rr_ratio = input.default_rr_ratio;

  // Try update first
  const { data, error } = await db
    .from('user_preferences')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    // If no row exists, create one
    if (error.code === 'PGRST116') {
      const { data: inserted, error: insertError } = await db
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...updates,
        })
        .select()
        .single();

      if (insertError) {
        logger.error('Failed to create preferences', { userId, error: insertError.message });
        throw new Error(`Failed to create preferences: ${insertError.message}`);
      }

      return inserted as IUserPreferences;
    }

    logger.error('Failed to update preferences', { userId, error: error.message });
    throw new Error(`Failed to update preferences: ${error.message}`);
  }

  if (!data) {
    // Row didn't exist, create it
    const { data: inserted, error: insertError } = await db
      .from('user_preferences')
      .insert({
        user_id: userId,
        ...updates,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to create preferences: ${insertError.message}`);
    }

    return inserted as IUserPreferences;
  }

  logger.info('Preferences updated', { userId });
  return data as IUserPreferences;
}

// ──────────────────────────────────────────────
// Ensure preferences exist (create defaults)
// ──────────────────────────────────────────────

export async function ensurePreferences(userId: string): Promise<IUserPreferences> {
  const existing = await getPreferences(userId);
  if (existing) return existing;

  const db = getSupabaseAdmin();

  const { data, error } = await db
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
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create default preferences', { userId, error: error.message });
    throw new Error(`Failed to create preferences: ${error.message}`);
  }

  return data as IUserPreferences;
}
