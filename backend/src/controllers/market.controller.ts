/**
 * Market Data Controller
 * 
 * HTTP handlers for market data endpoints.
 * 
 * Endpoints:
 *   GET /market/:symbol         → Get current price
 *   GET /market/:symbol/candles → Get historical candles
 *   GET /market/batch/prices    → Get multiple prices
 *   GET /market/providers       → Get provider info
 *   GET /market/cache/stats     → Get cache statistics
 */

import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@middleware/auth';
import * as marketService from '@services/market/market.service';
import { VALID_TIMEFRAMES } from '@models/market.types';
import { logger } from '@utils/logger';

/**
 * GET /market/:symbol
 * Get the current price for a symbol.
 */
export async function getPrice(req: Request, res: Response): Promise<void> {
  try {
    const { symbol } = req.params;

    if (!symbol) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Symbol is required.',
      });
      return;
    }

    const priceData = await marketService.getPrice(symbol.toUpperCase());

    res.status(200).json({
      success: true,
      data: priceData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch price';
    
    if (message.includes('No provider') || message.includes('not configured')) {
      logger.warn('Market provider error', { error: message, path: req.path });
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message,
      });
      return;
    }

    logger.error('getPrice failed', { error, symbol: req.params.symbol });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch price data.',
    });
  }
}

/**
 * GET /market/:symbol/candles
 * Get historical candle data for a symbol.
 */
export async function getCandles(req: Request, res: Response): Promise<void> {
  try {
    const { symbol } = req.params;
    const timeframe = (req.query.timeframe as string) || '1h';
    const limit = parseInt(req.query.limit as string, 10) || 100;

    if (!symbol) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Symbol is required.',
      });
      return;
    }

    if (!VALID_TIMEFRAMES.includes(timeframe as any)) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: `Invalid timeframe: ${timeframe}. Valid: ${VALID_TIMEFRAMES.join(', ')}`,
      });
      return;
    }

    if (limit < 1 || limit > 500) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Limit must be between 1 and 500.',
      });
      return;
    }

    const candleData = await marketService.getCandles(
      symbol.toUpperCase(),
      timeframe as any,
      limit
    );

    res.status(200).json({
      success: true,
      data: candleData,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch candles';
    
    if (message.includes('No provider') || message.includes('not configured')) {
      res.status(503).json({
        success: false,
        error: 'Service Unavailable',
        message,
      });
      return;
    }

    logger.error('getCandles failed', { error, symbol: req.params.symbol });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch candle data.',
    });
  }
}

/**
 * POST /market/batch/prices
 * Get prices for multiple symbols at once.
 */
export async function getBatchPrices(req: Request, res: Response): Promise<void> {
  try {
    const { symbols } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Provide an array of symbols.',
      });
      return;
    }

    if (symbols.length > 20) {
      res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Maximum 20 symbols per request.',
      });
      return;
    }

    const priceData = await marketService.getMultiplePrices(
      symbols.map((s: string | { symbol: string; marketType?: string }) => {
        if (typeof s === 'string') {
          return { symbol: s.toUpperCase() };
        }
        return { symbol: s.symbol.toUpperCase(), marketType: s.marketType as any };
      })
    );

    res.status(200).json({
      success: true,
      data: priceData,
    });
  } catch (error) {
    logger.error('getBatchPrices failed', { error });
    res.status(500).json({
      success: false,
      error: 'Internal Error',
      message: 'Failed to fetch batch prices.',
    });
  }
}

/**
 * GET /market/providers
 * Get available market data providers and their capabilities.
 */
export async function getProviders(_req: Request, res: Response): Promise<void> {
  const providers = marketService.getProviderInfo();

  res.status(200).json({
    success: true,
    data: providers,
  });
}

/**
 * GET /market/cache/stats
 * Get cache statistics.
 */
export async function getCacheStats(_req: Request, res: Response): Promise<void> {
  const stats = marketService.getMarketCacheStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
}
