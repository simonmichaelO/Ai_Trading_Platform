/**
 * Watchlist Repository
 * 
 * Database access layer for the user's watchlist.
 */

import { getSupabaseAdmin } from '@lib/supabase';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  user_id: string;
  symbol: string;
  market_type: string;
  notes: string | null;
  is_active: boolean;
  added_at: string;
}

// ──────────────────────────────────────────────
// List watchlist
// ──────────────────────────────────────────────

export async function listWatchlist(userId: string): Promise<WatchlistItem[]> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('watchlist')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('added_at', { ascending: false });

  if (error) {
    logger.error('Failed to list watchlist', { userId, error: error.message });
    throw new Error(`Failed to list watchlist: ${error.message}`);
  }

  return (data || []) as WatchlistItem[];
}

// ──────────────────────────────────────────────
// Add to watchlist
// ──────────────────────────────────────────────

export async function addToWatchlist(
  userId: string,
  symbol: string,
  marketType: string,
  notes?: string
): Promise<WatchlistItem> {
  const db = getSupabaseAdmin();

  // Check if already in watchlist
  const { data: existing } = await db
    .from('watchlist')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('symbol', symbol)
    .single();

  if (existing) {
    if (existing.is_active) {
      throw new Error(`${symbol} is already in your watchlist`);
    }
    // Re-activate if it was removed
    const { data, error } = await db
      .from('watchlist')
      .update({ is_active: true, notes: notes || null })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to re-add to watchlist: ${error.message}`);
    return data as WatchlistItem;
  }

  const { data, error } = await db
    .from('watchlist')
    .insert({
      user_id: userId,
      symbol: symbol.toUpperCase(),
      market_type: marketType,
      notes: notes || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to add to watchlist', { userId, symbol, error: error.message });
    throw new Error(`Failed to add to watchlist: ${error.message}`);
  }

  logger.info('Added to watchlist', { userId, symbol });
  return data as WatchlistItem;
}

// ──────────────────────────────────────────────
// Remove from watchlist
// ──────────────────────────────────────────────

export async function removeFromWatchlist(
  itemId: string,
  userId: string
): Promise<boolean> {
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('watchlist')
    .delete()
    .eq('id', itemId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to remove from watchlist', { itemId, userId, error: error.message });
    throw new Error(`Failed to remove from watchlist: ${error.message}`);
  }

  logger.info('Removed from watchlist', { itemId, userId });
  return true;
}
