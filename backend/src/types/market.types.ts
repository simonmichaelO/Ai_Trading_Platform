/**
 * Market Data Type Definitions
 * 
 * Shared types for all market data operations.
 * Used by providers, services, controllers, and repositories.
 */

// ──────────────────────────────────────────────
// Price Data
// ──────────────────────────────────────────────

/** Current price snapshot for a symbol */
export interface PriceData {
  symbol: string;
  market_type: MarketType;
  price: number;
  change_24h: number;        // Percentage change (-5.2 = down 5.2%)
  change_24h_abs: number;    // Absolute price change
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  timestamp: string;
}

// ──────────────────────────────────────────────
// Candle Data (OHLCV)
// ──────────────────────────────────────────────

/** A single candlestick */
export interface Candle {
  time: string;        // ISO timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Historical candle data for a symbol */
export interface CandleData {
  symbol: string;
  market_type: MarketType;
  timeframe: string;
  candles: Candle[];
  fetched_at: string;
}

// ──────────────────────────────────────────────
// Enums & Constants
// ──────────────────────────────────────────────

export type MarketType = 'forex' | 'crypto' | 'stocks' | 'indices';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

/** Valid timeframes array for validation */
export const VALID_TIMEFRAMES: Timeframe[] = ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'];

// ──────────────────────────────────────────────
// Provider Types
// ──────────────────────────────────────────────

/** What a market provider can fetch */
export interface MarketProviderCapabilities {
  livePrice: boolean;
  historicalCandles: boolean;
  supportedTimeframes: Timeframe[];
  supportedMarkets: MarketType[];
}

// ──────────────────────────────────────────────
// Cache Types
// ──────────────────────────────────────────────

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;  // Unix timestamp in ms
}

/** Default cache TTLs in milliseconds */
export const CACHE_TTL = {
  /** Live prices — cache for 30 seconds */
  PRICE: 30 * 1000,
  /** 1m-15m candles — cache for 60 seconds */
  CANDLE_SHORT: 60 * 1000,
  /** 1h-4h candles — cache for 5 minutes */
  CANDLE_MEDIUM: 5 * 60 * 1000,
  /** Daily/weekly candles — cache for 15 minutes */
  CANDLE_LONG: 15 * 60 * 1000,
} as const;

// ──────────────────────────────────────────────
// Supported Symbols
// ──────────────────────────────────────────────

/** Common crypto symbols */
export const CRYPTO_SYMBOLS = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT',
  'XRP/USDT', 'ADA/USDT', 'DOGE/USDT', 'AVAX/USDT',
  'DOT/USDT', 'MATIC/USDT', 'LINK/USDT', 'UNI/USDT',
];

/** Common forex pairs */
export const FOREX_SYMBOLS = [
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
  'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP',
  'EUR/JPY', 'GBP/JPY',
];

/** Common stock/index symbols */
export const STOCK_SYMBOLS = [
  'SPX500', 'NASDAQ', 'DJI', 'AAPL', 'MSFT',
  'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META',
];
