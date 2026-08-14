/**
 * Analysis Service
 * 
 * Orchestrates the full analysis workflow:
 *   1. Gather market data (from market service)
 *   2. Get strategy (if specified)
 *   3. Call AI service
 *   4. Save analysis to database
 *   5. Return complete result
 */

import { performAnalysis, getAvailableProviders, AnalysisRequest } from '@services/ai/ai.service';
import * as analysisRepo from '@repositories/analysis.repository';
import * as strategyRepo from '@repositories/strategy.repository';
import { getPrice, getCandles } from '@services/market/market.service';
import { createAuditLog } from '@repositories/audit.repository';
import { logger } from '@utils/logger';
import type { AIProvider, AnalysisType, MarketType } from '@models/index';

// ──────────────────────────────────────────────
// Analysis Request
// ──────────────────────────────────────────────

export interface CreateAnalysisInput {
  userId: string;
  symbol: string;
  timeframe: string;
  marketType?: MarketType;
  provider: AIProvider;
  analysisType: AnalysisType;
  strategyId?: string;
  chartImage?: string;
}

// ──────────────────────────────────────────────
// Main Analysis Function
// ──────────────────────────────────────────────

/**
 * Run a complete AI analysis:
 * - Fetch market data
 * - Build context from strategy
 * - Call AI
 * - Save to database
 */
export async function runAnalysis(input: CreateAnalysisInput) {
  const { userId, symbol, timeframe, provider, analysisType, strategyId, chartImage } = input;

  logger.info('Running analysis', { userId, symbol, timeframe, provider, analysisType });

  // 1. Get market data
    let marketSnapshot;
  try {
    const priceData = await getPrice(symbol);

    // Try to get candles, but make it non-fatal
    let candles = [];
    try {
      const candleData = await getCandles(symbol, timeframe as any, 50);
      candles = candleData.candles || [];
    } catch (candleError) {
      logger.warn('Candle fetch failed, using price-only snapshot', {
        symbol,
        error: candleError.message || 'Unknown',
      });
    }

    marketSnapshot = {
      symbol,
      timeframe,
      price: {
        open: candles[candles.length - 1]?.open || priceData.price,
        high: priceData.high_24h,
        low: priceData.low_24h,
        close: priceData.price,
      },
      candles,
      volume: priceData.volume_24h,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to fetch market data', { symbol, error: errMsg });
    throw new Error(`Failed to fetch market data for ${symbol}: ${errMsg}`);
  }

  // 2. Get strategy (if specified)
  let strategy = undefined;
  if (strategyId) {
    try {
      const strat = await strategyRepo.getStrategyById(strategyId, userId);
      if (strat) {
        strategy = {
          name: strat.name,
          description: strat.description || undefined,
          entry_rules: strat.entry_rules,
          exit_rules: strat.exit_rules,
          risk_rules: strat.risk_rules,
          indicators: strat.indicators,
          prompt_template: strat.prompt_template || undefined,
        };
      }
    } catch (error) {
      logger.warn('Failed to load strategy', { strategyId, error });
    }
  }

  // If no strategy specified, try to use the user's default
  if (!strategy) {
    try {
      const strategies = await strategyRepo.listStrategies(userId, { enabledOnly: true });
      const defaultStrategy = strategies.find(s => s.is_default) || strategies[0];
      if (defaultStrategy) {
        strategy = {
          name: defaultStrategy.name,
          description: defaultStrategy.description || undefined,
          entry_rules: defaultStrategy.entry_rules,
          exit_rules: defaultStrategy.exit_rules,
          risk_rules: defaultStrategy.risk_rules,
          indicators: defaultStrategy.indicators,
          prompt_template: defaultStrategy.prompt_template || undefined,
        };
      }
    } catch (error) {
      logger.warn('Failed to load default strategy', { userId, error });
    }
  }

  // 3. Run AI analysis
  const analysisRequest: AnalysisRequest = {
    symbol,
    timeframe,
    marketSnapshot,
    provider,
    analysisType,
    chartImage,
    strategy,
  };

  const aiResult = await performAnalysis(analysisRequest);

  // 4. Save to database
  const structured = aiResult.response.structured;
  const analysis = await analysisRepo.createAnalysis(userId, {
    symbol,
    timeframe,
    market_type: input.marketType || (marketSnapshot.symbol.includes('/') ? 'forex' : 'crypto'),
    market_snapshot: marketSnapshot,
    ai_provider: aiResult.providerId,
    ai_model: aiResult.response.model,
    analysis_type: analysisType,
    reasoning: aiResult.response.reasoning,
    confidence_score: structured.confidence,
    chart_annotations: structured.key_levels.length > 0
      ? { key_levels: structured.key_levels }
      : undefined,
    entry_price: structured.entry_price ?? undefined,
    stop_loss: structured.stop_loss ?? undefined,
    take_profit_1: structured.take_profit_1 ?? undefined,
    take_profit_2: structured.take_profit_2 ?? undefined,
    take_profit_3: structured.take_profit_3 ?? undefined,
    direction: structured.direction,
    strategy_id: strategyId || undefined,
    chart_image_url: chartImage ? 'base64_embedded' : undefined,
  });

  // 5. Audit log
  await createAuditLog({
    user_id: userId,
    action: 'analysis.created',
    entity_type: 'analysis',
    entity_id: analysis.id,
    metadata: {
      symbol,
      timeframe,
      provider: aiResult.providerId,
      direction: aiResult.response.structured.direction,
      confidence: aiResult.response.structured.confidence,
      tokens_used: aiResult.response.usage.totalTokens,
    },
  });

  logger.info('Analysis saved', { analysisId: analysis.id, userId, symbol });

  // 6. Return complete result
  return {
    analysis,
    ai: {
      provider: aiResult.providerUsed,
      model: aiResult.response.model,
      usage: aiResult.response.usage,
      structured: aiResult.response.structured,
    },
  };
}

// ──────────────────────────────────────────────
// Export provider info for frontend
// ──────────────────────────────────────────────

export { getAvailableProviders };
