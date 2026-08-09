/**
 * Market Provider Interface
 * 
 * Defines the contract that all market data providers must implement.
 * This allows easy swapping and adding of new data sources.
 * 
 * Each provider handles a specific market type or data source:
 * - CryptoProvider → CoinGecko API
 * - ForexProvider → Frankfurter API
 * - StocksProvider → Alpha Vantage API
 * 
 * To add a new provider:
 *   1. Create a new file in this directory
 *   2. Implement MarketProvider interface
 *   3. Register it in MarketService
 */

import { PriceData, CandleData, MarketType, Timeframe, MarketProviderCapabilities } from '@models/market.types';

/**
 * Interface that all market data providers must implement.
 */
export interface MarketProvider {
  /** Human-readable name of this provider */
  readonly name: string;

  /** What market types this provider handles */
  readonly supportedMarkets: MarketType[];

  /** What this provider can do */
  readonly capabilities: MarketProviderCapabilities;

  /**
   * Get the current price for a symbol.
   * @param symbol - Trading pair (e.g., 'BTC/USDT', 'EUR/USD')
   * @returns Current price data
   * @throws Error if the symbol is not supported or API fails
   */
  getPrice(symbol: string): Promise<PriceData>;

  /**
   * Get historical candle data for a symbol.
   * @param symbol - Trading pair
   * @param timeframe - Candle interval
   * @param limit - Number of candles (max depends on provider)
   * @returns Historical candle data
   * @throws Error if the timeframe is not supported or API fails
   */
  getCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<CandleData>;

  /**
   * Check if this provider can handle a specific symbol.
   * @param symbol - The symbol to check
   * @returns true if this provider supports the symbol
   */
  supportsSymbol(symbol: string): boolean;
}

/**
 * Base class with shared utility methods for providers.
 */
export abstract class BaseMarketProvider implements MarketProvider {
  abstract readonly name: string;
  abstract readonly supportedMarkets: MarketType[];
  abstract readonly capabilities: MarketProviderCapabilities;

  abstract getPrice(symbol: string): Promise<PriceData>;
  abstract getCandles(symbol: string, timeframe: Timeframe, limit?: number): Promise<CandleData>;

  /**
   * Parse a symbol string into base and quote currencies.
   * Handles formats: 'BTC/USDT', 'BTCUSDT', 'BTC-USDT'
   */
  protected parseSymbol(symbol: string): { base: string; quote: string } {
    // Try splitting by common separators
    const separators = ['/', '-', ''];
    
    for (const sep of separators) {
      if (sep && symbol.includes(sep)) {
        const parts = symbol.split(sep);
        if (parts.length === 2) {
          return { base: parts[0].toUpperCase(), quote: parts[1].toUpperCase() };
        }
      }
    }

    // For symbols without separators (e.g., 'EURUSD'), try splitting at midpoint
    const upper = symbol.toUpperCase();
    if (upper.length === 6) {
      return { base: upper.substring(0, 3), quote: upper.substring(3, 6) };
    }

    // Default: treat entire symbol as base
    return { base: upper, quote: 'USD' };
  }

  /**
   * Check if this provider supports a given symbol.
   * Override in subclasses for specific symbol validation.
   */
  supportsSymbol(_symbol: string): boolean {
    return true;
  }

  /**
   * Safely fetch from an API with error handling.
   */
  protected async safeFetch<T>(url: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AI-Trading-Platform/1.0',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`API request failed (${response.status}): ${text}`);
      }

      return await response.json() as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}
