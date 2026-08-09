/**
 * Trade Repository
 * 
 * Database access layer for the trading journal.
 * Handles CRUD operations for the trades table.
 */

import { getSupabaseAdmin } from '@lib/supabase';
import { logger } from '@utils/logger';
import type { ITrade, TradeCreate, TradeUpdate, TradeStatus } from '@models/index';

// ──────────────────────────────────────────────
// List trades with pagination and filters
// ──────────────────────────────────────────────

export async function listTrades(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    status?: TradeStatus;
    symbol?: string;
    strategyId?: string;
  } = {}
): Promise<{ data: ITrade[]; total: number }> {
  const db = getSupabaseAdmin();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let query = db
    .from('trades')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('opened_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.status) {
    query = query.eq('status', options.status);
  }
  if (options.symbol) {
    query = query.eq('symbol', options.symbol);
  }
  if (options.strategyId) {
    query = query.eq('strategy_id', options.strategyId);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Failed to list trades', { userId, error: error.message });
    throw new Error(`Failed to list trades: ${error.message}`);
  }

  return {
    data: (data || []) as ITrade[],
    total: count || 0,
  };
}

// ──────────────────────────────────────────────
// Get a single trade
// ──────────────────────────────────────────────

export async function getTradeById(
  tradeId: string,
  userId: string
): Promise<ITrade | null> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('trades')
    .select('*')
    .eq('id', tradeId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error('Failed to get trade', { tradeId, userId, error: error.message });
    throw new Error(`Failed to get trade: ${error.message}`);
  }

  return data as ITrade;
}

// ──────────────────────────────────────────────
// Create a new trade (open position)
// ──────────────────────────────────────────────

export async function createTrade(
  userId: string,
  input: TradeCreate
): Promise<ITrade> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('trades')
    .insert({
      user_id: userId,
      analysis_id: input.analysis_id || null,
      strategy_id: input.strategy_id || null,
      symbol: input.symbol,
      direction: input.direction,
      entry_price: input.entry_price,
      stop_loss: input.stop_loss || null,
      take_profit: input.take_profit || null,
      status: 'open',
      risk_reward_ratio: input.risk_reward_ratio || null,
      position_size: input.position_size || null,
      notes: input.notes || null,
      tags: input.tags || [],
      emotional_state: input.emotional_state || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create trade', { userId, symbol: input.symbol, error: error.message });
    throw new Error(`Failed to create trade: ${error.message}`);
  }

  logger.info('Trade opened', { tradeId: data.id, userId, symbol: input.symbol, direction: input.direction });
  return data as ITrade;
}

// ──────────────────────────────────────────────
// Update a trade (close, edit notes, etc.)
// ──────────────────────────────────────────────

export async function updateTrade(
  tradeId: string,
  userId: string,
  input: TradeUpdate
): Promise<ITrade | null> {
  const db = getSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (input.status !== undefined) updates.status = input.status;
  if (input.exit_price !== undefined) updates.exit_price = input.exit_price;
  if (input.pnl !== undefined) updates.pnl = input.pnl;
  if (input.pnl_percent !== undefined) updates.pnl_percent = input.pnl_percent;
  if (input.outcome !== undefined) updates.outcome = input.outcome;
  if (input.notes !== undefined) updates.notes = input.notes;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.lessons_learned !== undefined) updates.lessons_learned = input.lessons_learned;
  if (input.closed_at !== undefined) updates.closed_at = input.closed_at;

  // Auto-set closed_at when closing
  if (input.status === 'closed' && !input.closed_at) {
    updates.closed_at = new Date().toISOString();
  }

  const { data, error } = await db
    .from('trades')
    .update(updates)
    .eq('id', tradeId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update trade', { tradeId, userId, error: error.message });
    throw new Error(`Failed to update trade: ${error.message}`);
  }

  if (!data) return null;

  logger.info('Trade updated', { tradeId, userId, status: input.status });
  return data as ITrade;
}

// ──────────────────────────────────────────────
// Delete a trade
// ──────────────────────────────────────────────

export async function deleteTrade(
  tradeId: string,
  userId: string
): Promise<boolean> {
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('trades')
    .delete()
    .eq('id', tradeId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete trade', { tradeId, userId, error: error.message });
    throw new Error(`Failed to delete trade: ${error.message}`);
  }

  logger.info('Trade deleted', { tradeId, userId });
  return true;
}

// ──────────────────────────────────────────────
// Trading statistics for dashboard
// ──────────────────────────────────────────────

export async function getTradeStats(userId: string): Promise<{
  totalTrades: number;
  openTrades: number;
  winRate: number;
  totalPnl: number;
}> {
  const db = getSupabaseAdmin();

  const { data: trades, error } = await db
    .from('trades')
    .select('status, outcome, pnl')
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to get trade stats', { userId, error: error.message });
    return { totalTrades: 0, openTrades: 0, winRate: 0, totalPnl: 0 };
  }

  const allTrades = trades || [];
  const closedTrades = allTrades.filter((t: { status: string }) => t.status === 'closed');
  const wins = closedTrades.filter((t: { outcome: string }) => t.outcome === 'win');
  const totalPnl = allTrades.reduce((sum: number, t: { pnl: number | null }) => sum + (t.pnl || 0), 0);

  return {
    totalTrades: allTrades.length,
    openTrades: allTrades.filter((t: { status: string }) => t.status === 'open').length,
    winRate: closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0,
    totalPnl,
  };
}
