/**
 * Strategy Repository
 * 
 * Database access layer for trading strategies.
 * All CRUD operations for the strategies table.
 * 
 * Uses the service_role Supabase client (bypasses RLS).
 * Authorization is handled at the controller/middleware level.
 */

import { getSupabaseAdmin } from '@lib/supabase';
import { logger } from '@utils/logger';
import type { IStrategy, StrategyCreate, StrategyUpdate } from '@models/index';

// ──────────────────────────────────────────────
// List strategies for a user
// ──────────────────────────────────────────────

export async function listStrategies(
  userId: string,
  options: { enabledOnly?: boolean } = {}
): Promise<IStrategy[]> {
  const db = getSupabaseAdmin();

  let query = db
    .from('strategies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.enabledOnly) {
    query = query.eq('is_enabled', true);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to list strategies', { userId, error: error.message });
    throw new Error(`Failed to list strategies: ${error.message}`);
  }

  return (data || []) as IStrategy[];
}

// ──────────────────────────────────────────────
// Get a single strategy
// ──────────────────────────────────────────────

export async function getStrategyById(
  strategyId: string,
  userId: string
): Promise<IStrategy | null> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('strategies')
    .select('*')
    .eq('id', strategyId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    logger.error('Failed to get strategy', { strategyId, userId, error: error.message });
    throw new Error(`Failed to get strategy: ${error.message}`);
  }

  return data as IStrategy;
}

// ──────────────────────────────────────────────
// Create a new strategy
// ──────────────────────────────────────────────

export async function createStrategy(
  userId: string,
  input: StrategyCreate
): Promise<IStrategy> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('strategies')
    .insert({
      user_id: userId,
      name: input.name,
      description: input.description || null,
      entry_rules: input.entry_rules || [],
      exit_rules: input.exit_rules || [],
      risk_rules: input.risk_rules || [],
      indicators: input.indicators || [],
      prompt_template: input.prompt_template || null,
      is_enabled: input.is_enabled !== undefined ? input.is_enabled : true,
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create strategy', { userId, name: input.name, error: error.message });
    throw new Error(`Failed to create strategy: ${error.message}`);
  }

  logger.info('Strategy created', { strategyId: data.id, userId, name: input.name });
  return data as IStrategy;
}

// ──────────────────────────────────────────────
// Update a strategy
// ──────────────────────────────────────────────

export async function updateStrategy(
  strategyId: string,
  userId: string,
  input: StrategyUpdate
): Promise<IStrategy | null> {
  const db = getSupabaseAdmin();

  // Build update object — only include fields that are provided
  const updates: Record<string, unknown> = {};
  if (input.name !== undefined) updates.name = input.name;
  if (input.description !== undefined) updates.description = input.description;
  if (input.entry_rules !== undefined) updates.entry_rules = input.entry_rules;
  if (input.exit_rules !== undefined) updates.exit_rules = input.exit_rules;
  if (input.risk_rules !== undefined) updates.risk_rules = input.risk_rules;
  if (input.indicators !== undefined) updates.indicators = input.indicators;
  if (input.prompt_template !== undefined) updates.prompt_template = input.prompt_template;
  if (input.is_enabled !== undefined) updates.is_enabled = input.is_enabled;
  if (input.is_default !== undefined) updates.is_default = input.is_default;

  // If setting as default, unset other defaults first
  if (input.is_default === true) {
    await db
      .from('strategies')
      .update({ is_default: false })
      .eq('user_id', userId);
  }

  const { data, error } = await db
    .from('strategies')
    .update(updates)
    .eq('id', strategyId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    logger.error('Failed to update strategy', { strategyId, userId, error: error.message });
    throw new Error(`Failed to update strategy: ${error.message}`);
  }

  if (!data) return null;

  logger.info('Strategy updated', { strategyId, userId });
  return data as IStrategy;
}

// ──────────────────────────────────────────────
// Delete a strategy
// ──────────────────────────────────────────────

export async function deleteStrategy(
  strategyId: string,
  userId: string
): Promise<boolean> {
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('strategies')
    .delete()
    .eq('id', strategyId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete strategy', { strategyId, userId, error: error.message });
    throw new Error(`Failed to delete strategy: ${error.message}`);
  }

  logger.info('Strategy deleted', { strategyId, userId });
  return true;
}

// ──────────────────────────────────────────────
// Create default strategy for new users
// ──────────────────────────────────────────────

export async function createDefaultStrategy(userId: string): Promise<IStrategy> {
  return createStrategy(userId, {
    name: 'Smart Money Concepts',
    description: 'Default strategy based on Smart Money Concepts (SMC). Analyzes market structure, order blocks, and liquidity.',
    entry_rules: [
      'Wait for confirmation of trend direction (BOS/CHOCH)',
      'Identify order block in the direction of the trend',
      'Enter on pullback to the order block',
      'Confirm entry with lower timeframe structure shift',
    ],
    exit_rules: [
      'Take profit at next significant liquidity zone',
      'Move stop loss to breakeven after 1:2 RR is achieved',
      'Exit if market structure shifts against position',
    ],
    risk_rules: [
      'Risk no more than 1-2% of account per trade',
      'Minimum risk-to-reward ratio of 1:2',
      'Maximum 3 open positions at a time',
      'No trading during high-impact news events',
    ],
    indicators: ['Market Structure', 'Order Blocks', 'Fair Value Gaps', 'Liquidity Levels'],
    prompt_template: `Analyze the market using Smart Money Concepts framework.

Focus on:
1. Market Structure: Identify the current trend (bullish/bearish/ranging)
2. Key Levels: Mark support/resistance, order blocks, and FVGs
3. Liquidity: Identify where stop losses are likely clustered
4. Entry: Suggest optimal entry based on SMC principles
5. Risk: Provide stop loss and take profit levels

Be specific about price levels and explain your reasoning.`,
    is_enabled: true,
  });
}
