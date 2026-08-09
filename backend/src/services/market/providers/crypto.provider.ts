/**
 * Crypto Market Provider — CoinGecko API
 * 
 * Fetches cryptocurrency prices and historical data from CoinGecko.
 * 
 * API: https://www.coingecko.com/en/api/documentation
 * Free tier: 10-30 calls/minute, no API key required
 * 
 * Supported pairs: All major crypto/USDT pairs
 * Supported timeframes: 1m, 5m, 15m, 30m, 1h, 4h, 1d
 */

import { BaseMarketProvider } from './market-provider';
import { PriceData, CandleData, Candle, MarketType, Timeframe, MarketProviderCapabilities } from '@models/market.types';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// CoinGecko ID Mapping
// ──────────────────────────────────────────────

/** Map common symbols to CoinGecko coin IDs */
const COIN_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'AVAX': 'avalanche-2',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'LINK': 'chainlink',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'SHIB': 'shiba-inu',
  'TRX': 'tron',
};

/** Map timeframe to CoinGecko API parameters */
const TIMEFRAME_MAP: Record<Timeframe, { days: number; interval?: string }> = {
  '1m':  { days: 1, interval: 'minutely' },
  '5m':  { days: 2, interval: 'minutely' },
  '15m': { days: 7, interval: 'minutely' },
  '30m': { days: 14, interval: 'hourly' },
  '1h':  { days: 30, interval: 'hourly' },
  '4h':  { days: 90, interval: 'hourly' },
  '1d':  { days: 365, interval: 'daily' },
  '1w':  { days: 365, interval: 'daily' },
};

const BASE_URL = 'https://api.coingecko.com/api/v3';

export class CryptoProvider extends BaseMarketProvider {
  readonly name = 'CoinGecko';
  readonly supportedMarkets: MarketType[] = ['crypto'];

  readonly capabilities: MarketProviderCapabilities = {
    livePrice: true,
    historicalCandles: true,
    supportedTimeframes: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w'],
    supportedMarkets: ['crypto'],
  };

  supportsSymbol(symbol: string): boolean {
    const { base } = this.parseSymbol(symbol);
    return base in COIN_MAP;
  }

  /**
   * Get current crypto price from CoinGecko.
   */
  async getPrice(symbol: string): Promise<PriceData> {
    const { base } = this.parseSymbol(symbol);
    const coinId = COIN_MAP[base];

    if (!coinId) {
      throw new Error(`Unsupported crypto symbol: ${symbol}. Supported: ${Object.keys(COIN_MAP).join(', ')}`);
    }

    const url = `${BASE_URL}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;

    const data = await this.safeFetch<CoinGeckoCoinResponse>(url);

    const price = data.market_data.current_price.usd;
    const change24h = data.market_data.price_change_percentage_24h || 0;
    const high24h = data.market_data.high_24h.usd || price;
    const low24h = data.market_data.low_24h.usd || price;
    const volume = data.market_data.total_volume.usd || 0;

    return {
      symbol,
      market_type: 'crypto',
      price,
      change_24h: change24h,
      change_24h_abs: data.market_data.price_change_24h || 0,
      high_24h: high24h,
      low_24h: low24h,
      volume_24h: volume,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get historical candle data from CoinGecko.
   */
  async getCandles(symbol: string, timeframe: Timeframe, limit: number = 100): Promise<CandleData> {
    const { base } = this.parseSymbol(symbol);
    const coinId = COIN_MAP[base];

    if (!coinId) {
      throw new Error(`Unsupported crypto symbol: ${symbol}`);
    }

    const tfConfig = TIMEFRAME_MAP[timeframe];
    const url = `${BASE_URL}/coins/${coinId}/market_data?vs_currency=usd&days=${tfConfig.days}${tfConfig.interval ? `&interval=${tfConfig.interval}` : ''}`;

    const data = await this.safeFetch<CoinGeckoMarketDataResponse>(url);

    // Convert CoinGecko format to our Candle format
    const rawCandles: Candle[] = (data.prices || []).map((pricePoint: number[], index: number) => {
      const time = new Date(pricePoint[0]).toISOString();
      const open = pricePoint[1];
      const close = pricePoint[1]; // CoinGecko gives close prices
      
      // Use high/low arrays if available, otherwise use close as approximation
      const high = data.total_volumes?.[index]?.[1] ? Math.max(open, close) * 1.001 : open;
      const low = data.total_volumes?.[index]?.[1] ? Math.min(open, close) * 0.999 : open;
      const volume = data.total_volumes?.[index]?.[1] || 0;

      return { time, open, high, low, close, volume };
    });

    // If we have proper OHLC data, use it; otherwise create from close prices
    const candles = rawCandles.length > 0 ? rawCandles : this.createCandlesFromPrices(
      (data.prices || []).map((p: number[]) => ({ time: p[0], price: p[1] }))
    );

    // Apply limit
    const limitedCandles = candles.slice(-limit);

    return {
      symbol,
      market_type: 'crypto',
      timeframe,
      candles: limitedCandles,
      fetched_at: new Date().toISOString(),
    };
  }

  /**
   * Create synthetic candles from price points.
   * Used when CoinGecko only provides close prices (not full OHLC).
   */
  private createCandlesFromPrices(prices: Array<{ time: number; price: number }>): Candle[] {
    if (prices.length < 2) return [];

    return prices.map((point, index) => {
      const prevPrice = index > 0 ? prices[index - 1].price : point.price;
      const open = prevPrice;
      const close = point.price;
      const high = Math.max(open, close);
      const low = Math.min(open, close);

      return {
        time: new Date(point.time).toISOString(),
        open,
        high,
        low,
        close,
        volume: 0,
      };
    });
  }
}

// ──────────────────────────────────────────────
// CoinGecko API Response Types
// ──────────────────────────────────────────────

interface CoinGeckoCoinResponse {
  market_data: {
    current_price: { usd: number };
    price_change_24h: number;
    price_change_percentage_24h: number;
    high_24h: { usd: number };
    low_24h: { usd: number };
    total_volume: { usd: number };
  };
}

interface CoinGeckoMarketDataResponse {
  prices: number[][];         // [[timestamp, price], ...]
  total_volumes: number[][];  // [[timestamp, volume], ...]
  market_caps: number[][];    // [[timestamp, cap], ...]
}
