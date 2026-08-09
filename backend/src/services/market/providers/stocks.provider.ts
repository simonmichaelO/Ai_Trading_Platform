/**
 * Stocks & Indices Market Provider — Alpha Vantage API
 * 
 * Fetches stock and index prices from Alpha Vantage.
 * 
 * API: https://www.alphavantage.co/documentation/
 * Free tier: 25 requests/day (with free API key)
 * 
 * 🔴 CHANGE THIS — Get your free API key from:
 * https://www.alphavantage.co/support/#api-key
 * 
 * Without an API key, this provider returns helpful error messages
 * but the rest of the platform still works (crypto + forex only).
 */

import { BaseMarketProvider } from './market-provider';
import { PriceData, CandleData, Candle, MarketType, Timeframe, MarketProviderCapabilities } from '@models/market.types';
import config from '@config/index';
import { logger } from '@utils/logger';

// 🔴 CHANGE THIS — Set ALPHAVANTAGE_API_KEY in backend/.env
// Get a free key at: https://www.alphavantage.co/support/#api-key
const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY || '';

/** Map common index/stock symbols to Alpha Vantage symbols */
const SYMBOL_MAP: Record<string, string> = {
  'SPX500': 'SPY',     // S&P 500 ETF
  'NASDAQ': 'QQQ',     // NASDAQ 100 ETF
  'DJI': 'DIA',        // Dow Jones ETF
  'AAPL': 'AAPL',
  'MSFT': 'MSFT',
  'GOOGL': 'GOOGL',
  'AMZN': 'AMZN',
  'TSLA': 'TSLA',
  'NVDA': 'NVDA',
  'META': 'META',
};

/** Map timeframes to Alpha Vantage intervals */
const INTERVAL_MAP: Record<Timeframe, string> = {
  '1m':  '1min',
  '5m':  '5min',
  '15m': '15min',
  '30m': '30min',
  '1h':  '60min',
  '4h':  'daily',    // No 4h — use daily
  '1d':  'daily',
  '1w':  'weekly',
};

const BASE_URL = 'https://www.alphavantage.co/query';

export class StocksProvider extends BaseMarketProvider {
  readonly name = 'Alpha Vantage';
  readonly supportedMarkets: MarketType[] = ['stocks', 'indices'];

  readonly capabilities: MarketProviderCapabilities = {
    livePrice: true,
    historicalCandles: true,
    supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '1d', '1w'],
    supportedMarkets: ['stocks', 'indices'],
  };

  private get apiKey(): string | null {
    return ALPHAVANTAGE_API_KEY && ALPHAVANTAGE_API_KEY !== 'your-alphavantage-api-key-here' 
      ? ALPHAVANTAGE_API_KEY 
      : null;
  }

  private get isConfigured(): boolean {
    return !!this.apiKey && this.apiKey !== 'your-alphavantage-api-key-here';
  }

  supportsSymbol(symbol: string): boolean {
    const { base } = this.parseSymbol(symbol);
    return base in SYMBOL_MAP;
  }

  /**
   * Get current stock/index price.
   */
  async getPrice(symbol: string): Promise<PriceData> {
    if (!this.isConfigured) {
      throw new Error(
        'Stocks provider not configured. Set ALPHAVANTAGE_API_KEY in backend/.env.\n' +
        'Get a free key at: https://www.alphavantage.co/support/#api-key'
      );
    }

    const { base } = this.parseSymbol(symbol);
    const avSymbol = SYMBOL_MAP[base];

    if (!avSymbol) {
      throw new Error(`Unsupported stock symbol: ${symbol}. Supported: ${Object.keys(SYMBOL_MAP).join(', ')}`);
    }

    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${avSymbol}&apikey=${this.apiKey}`;
    const data = await this.safeFetch<AlphaVantageQuoteResponse>(url);

    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }

    const quote = data['Global Quote'];
    if (!quote || !quote['05. price']) {
      throw new Error(`No price data for ${symbol}`);
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change'] || '0');
    const changePercent = parseFloat(quote['10. change percent'] || '0');
    const high = parseFloat(quote['03. high'] || String(price));
    const low = parseFloat(quote['04. low'] || String(price));
    const volume = parseInt(quote['06. volume'] || '0', 10);

    return {
      symbol,
      market_type: base === 'SPX500' || base === 'NASDAQ' || base === 'DJI' ? 'indices' : 'stocks',
      price,
      change_24h: changePercent,
      change_24h_abs: change,
      high_24h: high,
      low_24h: low,
      volume_24h: volume,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get historical candle data.
   */
  async getCandles(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<CandleData> {
    if (!this.isConfigured) {
      throw new Error('Stocks provider not configured. Set ALPHAVANTAGE_API_KEY in backend/.env.');
    }

    const { base } = this.parseSymbol(symbol);
    const avSymbol = SYMBOL_MAP[base];

    if (!avSymbol) {
      throw new Error(`Unsupported stock symbol: ${symbol}`);
    }

    const interval = INTERVAL_MAP[timeframe];
    const isDaily = timeframe === '1d' || timeframe === '4h' || timeframe === '1w';

    let url: string;
    if (isDaily) {
      const func = timeframe === '1w' ? 'TIME_SERIES_WEEKLY' : 'TIME_SERIES_DAILY';
      url = `${BASE_URL}?function=${func}&symbol=${avSymbol}&outputsize=compact&apikey=${this.apiKey}`;
    } else {
      url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${avSymbol}&interval=${interval}&outputsize=compact&apikey=${this.apiKey}`;
    }

    const data = await this.safeFetch<AlphaVantageTimeSeriesResponse>(url);

    // Find the time series data
    const seriesKey = Object.keys(data).find(k => k.includes('Time Series'));
    if (!seriesKey) {
      throw new Error(`No time series data for ${symbol}`);
    }

    const series = data[seriesKey] as Record<string, Record<string, string>>;
    
    const candles: Candle[] = Object.entries(series)
      .sort(([a], [b]) => b.localeCompare(a)) // Most recent first
      .slice(0, limit)
      .map(([date, values]) => ({
        time: new Date(date).toISOString(),
        open: parseFloat(values['1. open']),
        high: parseFloat(values['2. high']),
        low: parseFloat(values['3. low']),
        close: parseFloat(values['4. close']),
        volume: parseInt(values['5. volume'] || '0', 10),
      }))
      .reverse(); // Oldest first

    return {
      symbol,
      market_type: base === 'SPX500' || base === 'NASDAQ' || base === 'DJI' ? 'indices' : 'stocks',
      timeframe,
      candles,
      fetched_at: new Date().toISOString(),
    };
  }
}

// ──────────────────────────────────────────────
// Alpha Vantage Response Types
// ──────────────────────────────────────────────

interface AlphaVantageQuoteResponse {
  'Global Quote'?: {
    '01. symbol': string;
    '02. open': string;
    '03. high': string;
    '04. low': string;
    '05. price': string;
    '06. volume': string;
    '08. previous close': string;
    '09. change': string;
    '10. change percent': string;
  };
  'Error Message'?: string;
  'Note'?: string;
}

interface AlphaVantageTimeSeriesResponse {
  [key: string]: Record<string, Record<string, string>> | string;
}
