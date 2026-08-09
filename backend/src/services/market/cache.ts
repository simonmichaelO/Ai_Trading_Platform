/**
 * Market Data Cache
 * 
 * In-memory cache with TTL (Time To Live) for market data.
 * Reduces API calls to external providers and improves response speed.
 * 
 * Cache keys are composed of: market_type + symbol + timeframe
 * Each entry has a configurable expiration time.
 * 
 * Note: This is an in-memory cache (lost on server restart).
 * For persistence, we could later move to Redis or the database cache table.
 */

import { CacheEntry, CACHE_TTL, Timeframe } from '@models/market.types';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// Cache Store
// ──────────────────────────────────────────────

const cache = new Map<string, CacheEntry<unknown>>();

// Cleanup expired entries every 5 minutes
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of cache) {
      if (entry.expiresAt < now) {
        cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`Cache cleanup: removed ${removed} expired entries`, {
        remaining: cache.size,
      });
    }
  }, 5 * 60 * 1000); // Every 5 minutes
}

// Start cleanup on module load
startCleanup();

// ──────────────────────────────────────────────
// Cache Functions
// ──────────────────────────────────────────────

/**
 * Build a cache key from market parameters.
 */
function buildKey(type: string, symbol: string, timeframe?: string): string {
  return `${type}:${symbol.toUpperCase()}${timeframe ? `:${timeframe}` : ''}`;
}

/**
 * Get the appropriate TTL for a given data type.
 */
function getTTL(type: 'price' | 'candle', timeframe?: Timeframe): number {
  if (type === 'price') return CACHE_TTL.PRICE;

  switch (timeframe) {
    case '1m':
    case '5m':
    case '15m':
      return CACHE_TTL.CANDLE_SHORT;
    case '30m':
    case '1h':
    case '4h':
      return CACHE_TTL.CANDLE_MEDIUM;
    default:
      return CACHE_TTL.CANDLE_LONG;
  }
}

/**
 * Get cached data. Returns null if not cached or expired.
 */
export function getCachedData<T>(type: string, symbol: string, timeframe?: string): T | null {
  const key = buildKey(type, symbol, timeframe);
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) return null;

  // Check if expired
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store data in cache with appropriate TTL.
 */
export function setCachedData<T>(
  type: string,
  symbol: string,
  data: T,
  timeframe?: Timeframe
): void {
  const key = buildKey(type, symbol, timeframe);
  const ttl = getTTL(type as 'price' | 'candle', timeframe);

  cache.set(key, {
    data,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Clear all cached data for a symbol.
 */
export function clearSymbolCache(symbol: string): void {
  const prefix = symbol.toUpperCase();
  let removed = 0;

  for (const key of cache.keys()) {
    if (key.includes(prefix)) {
      cache.delete(key);
      removed++;
    }
  }

  logger.debug(`Cleared cache for ${symbol}`, { removed });
}

/**
 * Clear all cached data.
 */
export function clearAllCache(): void {
  cache.clear();
  logger.info('All market data cache cleared');
}

/**
 * Get cache statistics.
 */
export function getCacheStats(): {
  totalEntries: number;
  estimatedSizeMB: number;
} {
  return {
    totalEntries: cache.size,
    estimatedSizeMB: Math.round((JSON.stringify([...cache.entries()]).length / 1024 / 1024) * 100) / 100,
  };
}
