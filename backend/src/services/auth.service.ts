/**
 * Auth Service
 * 
 * Business logic for authentication operations.
 * Handles user lookup, session validation, and account initialization.
 * 
 * This sits between controllers and repositories:
 *   Controller → Auth Service → Repositories → Database
 */

import { logger } from '@utils/logger';
import { getUserById } from '@repositories/user.repository';
import { ensurePreferences } from '@repositories/preferences.repository';
import { createDefaultStrategy, listStrategies } from '@repositories/strategy.repository';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface CurrentUserResponse {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
  has_preferences: boolean;
  has_default_strategy: boolean;
}

// ──────────────────────────────────────────────
// Service Functions
// ──────────────────────────────────────────────

/**
 * Get the current authenticated user's full profile.
 */
export async function getCurrentUser(userId: string): Promise<CurrentUserResponse | null> {
  try {
    const user = await getUserById(userId);
    if (!user) return null;

    // Check if user has preferences
    let hasPreferences = false;
    try {
      const prefs = await ensurePreferences(userId);
      hasPreferences = !!prefs;
    } catch {
      hasPreferences = false;
    }

    // Check if user has at least one strategy
    let hasDefaultStrategy = false;
    try {
      const strategies = await listStrategies(userId);
      hasDefaultStrategy = strategies.length > 0;
    } catch {
      hasDefaultStrategy = false;
    }

    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      has_preferences: hasPreferences,
      has_default_strategy: hasDefaultStrategy,
    };
  } catch (error) {
    logger.error('Failed to get current user', { userId, error });
    return null;
  }
}

/**
 * Initialize a new user's account.
 * Creates default preferences and a default strategy.
 * Safe to call multiple times — only creates what's missing.
 */
export async function initializeUser(userId: string): Promise<void> {
  try {
    logger.info('Initializing new user', { userId });

    // 1. Create default preferences
    await ensurePreferences(userId);

    // 2. Create default strategy if user has none
    const existingStrategies = await listStrategies(userId);
    if (existingStrategies.length === 0) {
      const defaultStrategy = await createDefaultStrategy(userId);
      logger.info('Default strategy created', { strategyId: defaultStrategy.id, userId });
    }

    logger.info('User initialized successfully', { userId });
  } catch (error) {
    logger.error('Failed to initialize user', { userId, error });
    // Don't throw — initialization failure shouldn't block the user
  }
}
