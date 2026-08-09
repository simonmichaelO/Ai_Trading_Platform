/**
 * Analysis Repository
 * 
 * Database access layer for AI analyses.
 * Handles CRUD operations for the analyses table.
 */

import { getSupabaseAdmin } from '@lib/supabase';
import { logger } from '@utils/logger';
import type { IAnalysis, AnalysisCreate } from '@models/index';

// ──────────────────────────────────────────────
// List analyses with pagination
// ──────────────────────────────────────────────

export async function listAnalyses(
  userId: string,
  options: {
    page?: number;
    limit?: number;
    symbol?: string;
    strategyId?: string;
  } = {}
): Promise<{ data: IAnalysis[]; total: number }> {
  const db = getSupabaseAdmin();
  const page = options.page || 1;
  const limit = options.limit || 20;
  const offset = (page - 1) * limit;

  let query = db
    .from('analyses')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options.symbol) {
    query = query.eq('symbol', options.symbol);
  }

  if (options.strategyId) {
    query = query.eq('strategy_id', options.strategyId);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('Failed to list analyses', { userId, error: error.message });
    throw new Error(`Failed to list analyses: ${error.message}`);
  }

  return {
    data: (data || []) as IAnalysis[],
    total: count || 0,
  };
}

// ──────────────────────────────────────────────
// Get a single analysis
// ──────────────────────────────────────────────

export async function getAnalysisById(
  analysisId: string,
  userId: string
): Promise<IAnalysis | null> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    logger.error('Failed to get analysis', { analysisId, userId, error: error.message });
    throw new Error(`Failed to get analysis: ${error.message}`);
  }

  return data as IAnalysis;
}

// ──────────────────────────────────────────────
// Create a new analysis
// ──────────────────────────────────────────────

export async function createAnalysis(
  userId: string,
  input: AnalysisCreate
): Promise<IAnalysis> {
  const db = getSupabaseAdmin();

  const { data, error } = await db
    .from('analyses')
    .insert({
      user_id: userId,
      symbol: input.symbol,
      timeframe: input.timeframe,
      market_type: input.market_type,
      market_snapshot: input.market_snapshot,
      ai_provider: input.ai_provider,
      ai_model: input.ai_model,
      analysis_type: input.analysis_type,
      reasoning: input.reasoning,
      confidence_score: input.confidence_score || null,
      chart_annotations: input.chart_annotations || null,
      annotated_chart_url: input.annotated_chart_url || null,
      entry_price: input.entry_price || null,
      stop_loss: input.stop_loss || null,
      take_profit_1: input.take_profit_1 || null,
      take_profit_2: input.take_profit_2 || null,
      take_profit_3: input.take_profit_3 || null,
      direction: input.direction || null,
      strategy_id: input.strategy_id || null,
      chart_image_url: input.chart_image_url || null,
    })
    .select()
    .single();

  if (error) {
    logger.error('Failed to create analysis', { userId, symbol: input.symbol, error: error.message });
    throw new Error(`Failed to create analysis: ${error.message}`);
  }

  logger.info('Analysis created', { analysisId: data.id, userId, symbol: input.symbol });
  return data as IAnalysis;
}

// ──────────────────────────────────────────────
// Delete an analysis
// ──────────────────────────────────────────────

export async function deleteAnalysis(
  analysisId: string,
  userId: string
): Promise<boolean> {
  const db = getSupabaseAdmin();

  const { error } = await db
    .from('analyses')
    .delete()
    .eq('id', analysisId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to delete analysis', { analysisId, userId, error: error.message });
    throw new Error(`Failed to delete analysis: ${error.message}`);
  }

  logger.info('Analysis deleted', { analysisId, userId });
  return true;
}

// ──────────────────────────────────────────────
// Get analysis count for user
// ──────────────────────────────────────────────

export async function getAnalysisCount(userId: string): Promise<number> {
  const db = getSupabaseAdmin();

  const { count, error } = await db
    .from('analyses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    logger.error('Failed to count analyses', { userId, error: error.message });
    return 0;
  }

  return count || 0;
}
