/**
 * Forex Market Provider — Frankfurter API
 * 
 * Fetches forex exchange rates from the European Central Bank (ECB).
 * 
 * API: https://www.frankfurter.app/docs/
 * Free, no API key required, updated daily at ~16:00 CET
 * 
 * Supported currencies: All major fiat currencies
 * Limitation: Daily granularity only (no intraday candles)
 * 
 * For intraday forex data, users would need a paid provider
 * (Twelve Data, OANDA, etc.) — the provider interface makes
 * swapping trivial.
 */

import { BaseMarketProvider } from './market-provider';
import { PriceData, CandleData, Candle, MarketType, Timeframe, MarketProviderCapabilities } from '@models/market.types';
import { logger } from '@utils/logger';

/** Supported forex currencies (Frankfurter/ECB) */
const SUPPORTED_CURRENCIES = [
  'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'NZD',
  'CNY', 'SEK', 'NOK', 'DKK', 'PLN', 'HUF', 'CZK', 'TRY',
  'MXN', 'BRL', 'ZAR', 'INR', 'KRW', 'SGD', 'HKD', 'THB',
];

const BASE_URL = 'https://api.frankfurter.app';

export class ForexProvider extends BaseMarketProvider {
  readonly name = 'Frankfurter (ECB)';
  readonly supportedMarkets: MarketType[] = ['forex'];

  readonly capabilities: MarketProviderCapabilities = {
    livePrice: true,
    historicalCandles: true,
    // Frankfurter only supports daily rates (ECB data)
    supportedTimeframes: ['1d', '1w'],
    supportedMarkets: ['forex'],
  };

  supportsSymbol(symbol: string): boolean {
    const { base, quote } = this.parseSymbol(symbol);
    return SUPPORTED_CURRENCIES.includes(base) && SUPPORTED_CURRENCIES.includes(quote);
  }

  /**
   * Get current forex rate.
   */
  async getPrice(symbol: string): Promise<PriceData> {
    const { base, quote } = this.parseSymbol(symbol);

    if (!this.supportsSymbol(symbol)) {
      throw new Error(`Unsupported forex pair: ${symbol}`);
    }

    // Get latest rate
    const url = `${BASE_URL}/latest?from=${base}&to=${quote}`;
    const data = await this.safeFetch<FrankfurterLatestResponse>(url);

    const rate = data.rates[quote];
    if (!rate) {
      throw new Error(`Could not get rate for ${base}/${quote}`);
    }

    // Get yesterday's rate for change calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    // Skip weekends
    if (yesterday.getDay() === 0) yesterday.setDate(yesterday.getDate() - 2);
    if (yesterday.getDay() === 6) yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let prevRate = rate;

    try {
      const prevUrl = `${BASE_URL}/${yesterdayStr}?from=${base}&to=${quote}`;
      const prevData = await this.safeFetch<FrankfurterLatestResponse>(prevUrl);
      prevRate = prevData.rates[quote] || rate;
    } catch {
      // If we can't get yesterday's rate, just use current rate
      logger.warn('Could not fetch previous day forex rate', { symbol });
    }

    const change24h = prevRate > 0 ? ((rate - prevRate) / prevRate) * 100 : 0;
    const change24hAbs = rate - prevRate;

    return {
      symbol,
      market_type: 'forex',
      price: rate,
      change_24h: Math.round(change24h * 10000) / 10000, // Round to 4 decimals
      change_24h_abs: Math.round(change24hAbs * 10000) / 10000,
      high_24h: Math.max(rate, prevRate),
      low_24h: Math.min(rate, prevRate),
      volume_24h: 0, // Forex volume not available from ECB
      timestamp: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Get historical forex data.
   * Frankfurter provides daily rates — we convert them to candle format.
   */
  async getCandles(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<CandleData> {
    const { base, quote } = this.parseSymbol(symbol);

    if (!this.supportsSymbol(symbol)) {
      throw new Error(`Unsupported forex pair: ${symbol}`);
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    // For daily: get ~6 months of data
    // For weekly: get ~2 years
    if (timeframe === '1w') {
      startDate.setFullYear(startDate.getFullYear() - 2);
    } else {
      startDate.setMonth(startDate.getMonth() - 6);
    }

    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];

    const url = `${BASE_URL}/${startStr}..${endStr}?from=${base}&to=${quote}`;
    const data = await this.safeFetch<FrankfurterTimeSeriesResponse>(url);

    // Convert to candles
    const entries = Object.entries(data.rates).sort(([a], [b]) => a.localeCompare(b));
    
    let candles: Candle[] = entries.map(([date, rates]) => {
      const rate = (rates as Record<string, number>)[quote] || 0;
      return {
        time: new Date(date).toISOString(),
        open: rate,
        high: rate, // Daily data — no intraday high/low
        low: rate,
        close: rate,
        volume: 0,
      };
    });

    // If weekly timeframe requested, aggregate daily into weekly
    if (timeframe === '1w') {
      candles = this.aggregateToWeekly(candles);
    }

    // Apply limit
    candles = candles.slice(-limit);

    return {
      symbol,
      market_type: 'forex',
      timeframe,
      candles,
      fetched_at: new Date().toISOString(),
    };
  }

  /**
   * Aggregate daily candles into weekly candles.
   */
  private aggregateToWeekly(dailyCandles: Candle[]): Candle[] {
    const weeks: Map<string, Candle> = new Map();

    for (const candle of dailyCandles) {
      const date = new Date(candle.time);
      // Get Monday of this week
      const monday = new Date(date);
      monday.setDate(date.getDate() - date.getDay() + 1);
      const weekKey = monday.toISOString().split('T')[0];

      const existing = weeks.get(weekKey);
      if (existing) {
        existing.high = Math.max(existing.high, candle.high);
        existing.low = Math.min(existing.low, candle.low);
        existing.close = candle.close; // Last day's close
        existing.volume += candle.volume;
      } else {
        weeks.set(weekKey, {
          time: monday.toISOString(),
          open: candle.open, // First day's open
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        });
      }
    }

    return Array.from(weeks.values()).sort((a, b) => 
      new Date(a.time).getTime() - new Date(b.time).getTime()
    );
  }
}

// ──────────────────────────────────────────────
// API Response Types
// ──────────────────────────────────────────────

interface FrankfurterLatestResponse {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
}

interface FrankfurterTimeSeriesResponse {
  amount: number;
  base: string;
  start_date: string;
  end_date: string;
  rates: Record<string, Record<string, number>>;
}
