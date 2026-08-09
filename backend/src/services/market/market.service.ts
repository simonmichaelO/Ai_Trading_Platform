/**
 * Market Service
 * 
 * Central service that routes market data requests to the appropriate provider.
 * Handles caching, provider selection, and error fallback.
 * 
 * Flow:
 *   1. Check cache → return if fresh
 *   2. Select provider based on market type
 *   3. Fetch from provider
 *   4. Store in cache
 *   5. Return data
 */

import { MarketProvider } from './providers/market-provider';
import { CryptoProvider } from './providers/crypto.provider';
import { ForexProvider } from './providers/forex.provider';
import { StocksProvider } from './providers/stocks.provider';
import { getCachedData, setCachedData, getCacheStats } from './cache';
import { logger } from '@utils/logger';
import type {
  PriceData,
  CandleData,
  MarketType,
  Timeframe,
} from '@models/market.types';

// ──────────────────────────────────────────────
// Provider Registry
// ──────────────────────────────────────────────

/**
 * All registered providers, in order of priority.
 * The service picks the first provider that supports the requested market type.
 */
const providers: MarketProvider[] = [
  new CryptoProvider(),
  new ForexProvider(),
  new StocksProvider(),
];

/**
 * Get the appropriate provider for a market type.
 */
function getProvider(marketType: MarketType): MarketProvider {
  const provider = providers.find(p => p.supportedMarkets.includes(marketType));

  if (!provider) {
    throw new Error(
      `No provider configured for market type: ${marketType}.\n` +
      `Available providers: ${providers.map(p => `${p.name} (${p.supportedMarkets.join(',')})`).join(', ')}`
    );
  }

  return provider;
}

/**
 * Infer market type from a symbol string.
 */
export function inferMarketType(symbol: string): MarketType {
  const upper = symbol.toUpperCase();
  
  // Crypto indicators
  if (upper.includes('USDT') || upper.includes('USDC') || upper.includes('BTC') || upper.includes('ETH')) {
    return 'crypto';
  }
  
  // Stock/Index indicators
  const stockSymbols = ['SPX500', 'NASDAQ', 'DJI', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META'];
  if (stockSymbols.includes(upper)) {
    return ['SPX500', 'NASDAQ', 'DJI'].includes(upper) ? 'indices' : 'stocks';
  }

  // Forex (3-letter currency pairs)
  const forexPattern = /^[A-Z]{3}\/?[A-Z]{3}$/;
  if (forexPattern.test(upper.replace('/', ''))) {
    return 'forex';
  }

  // Default to crypto for unknown symbols
  return 'crypto';
}

// ──────────────────────────────────────────────
// Market Service Functions
// ──────────────────────────────────────────────

/**
 * Get the current price for a symbol.
 * Uses cache if available, otherwise fetches from provider.
 */
export async function getPrice(symbol: string, marketType?: MarketType): Promise<PriceData> {
  const type = marketType || inferMarketType(symbol);

  // Check cache first
  const cached = getCachedData<PriceData>('price', symbol);
  if (cached) {
    logger.debug('Price served from cache', { symbol, type });
    return cached;
  }

  // Fetch from provider
  const provider = getProvider(type);
  logger.info('Fetching price', { symbol, type, provider: provider.name });

  const priceData = await provider.getPrice(symbol);

  // Store in cache
  setCachedData('price', symbol, priceData);

  return priceData;
}

/**
 * Get historical candle data for a symbol.
 * Uses cache if available, otherwise fetches from provider.
 */
export async function getCandles(
  symbol: string,
  timeframe: Timeframe,
  limit: number = 100,
  marketType?: MarketType
): Promise<CandleData> {
  const type = marketType || inferMarketType(symbol);

  // Check cache first
  const cached = getCachedData<CandleData>('candle', symbol, timeframe);
  if (cached) {
    logger.debug('Candles served from cache', { symbol, type, timeframe });
    return cached;
  }

  // Fetch from provider
  const provider = getProvider(type);
  logger.info('Fetching candles', { symbol, type, timeframe, provider: provider.name, limit });

  const candleData = await provider.getCandles(symbol, timeframe, limit);

  // Store in cache
  setCachedData('candle', symbol, candleData, timeframe);

  return candleData;
}

/**
 * Get prices for multiple symbols at once.
 * Useful for the watchlist display.
 */
export async function getMultiplePrices(
  symbols: Array<{ symbol: string; marketType?: MarketType }>
): Promise<PriceData[]> {
  const results = await Promise.allSettled(
    symbols.map(({ symbol, marketType }) => getPrice(symbol, marketType))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<PriceData> => r.status === 'fulfilled')
    .map(r => r.value);
}

/**
 * Get cache statistics.
 */
export function getMarketCacheStats() {
  return getCacheStats();
}

/**
 * Get list of available providers and their capabilities.
 */
export function getProviderInfo() {
  return providers.map(p => ({
    name: p.name,
    markets: p.supportedMarkets,
    capabilities: p.capabilities,
  }));
}
