/**
 * useMarketData Hook
 * 
 * React Query hooks for market data fetching.
 * 
 * Usage:
 *   const { data: price } = usePrice('BTC/USDT');
 *   const { data: candles } = useCandles('ETH/USDT', '1h');
 *   const { data: prices } = useBatchPrices(['BTC/USDT', 'EUR/USD']);
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, apiPost, ApiResponse } from '@/lib/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface PriceData {
  symbol: string;
  market_type: string;
  price: number;
  change_24h: number;
  change_24h_abs: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  timestamp: string;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface CandleData {
  symbol: string;
  market_type: string;
  timeframe: string;
  candles: Candle[];
  fetched_at: string;
}

export interface ProviderInfo {
  name: string;
  markets: string[];
  capabilities: {
    livePrice: boolean;
    historicalCandles: boolean;
    supportedTimeframes: string[];
    supportedMarkets: string[];
  };
}

// ──────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────

const MARKET_KEY = ['market'];

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

/**
 * Get the current price for a symbol.
 * Auto-refetches every 30 seconds.
 */
export function usePrice(symbol: string | null) {
  return useQuery({
    queryKey: [...MARKET_KEY, 'price', symbol],
    queryFn: async () => {
      const response = await apiGet<PriceData>(`/market/${symbol}`);
      return response.data;
    },
    enabled: !!symbol,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
    staleTime: 15 * 1000,       // Consider stale after 15 seconds
  });
}

/**
 * Get historical candle data for a symbol.
 */
export function useCandles(
  symbol: string | null,
  timeframe: string = '1h',
  limit: number = 100
) {
  return useQuery({
    queryKey: [...MARKET_KEY, 'candles', symbol, timeframe, limit],
    queryFn: async () => {
      const response = await apiGet<CandleData>(
        `/market/${symbol}/candles?timeframe=${timeframe}&limit=${limit}`
      );
      return response.data;
    },
    enabled: !!symbol,
    refetchInterval: 60 * 1000, // Refetch every 60 seconds
    staleTime: 30 * 1000,       // Consider stale after 30 seconds
  });
}

/**
 * Get prices for multiple symbols at once.
 */
export function useBatchPrices(symbols: string[]) {
  return useQuery({
    queryKey: [...MARKET_KEY, 'batch', symbols],
    queryFn: async () => {
      const response = await apiPost<PriceData[]>('/market/batch/prices', { symbols });
      return response.data;
    },
    enabled: symbols.length > 0,
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
  });
}

/**
 * Get available market data providers.
 */
export function useProviders() {
  return useQuery({
    queryKey: [...MARKET_KEY, 'providers'],
    queryFn: async () => {
      const response = await apiGet<ProviderInfo[]>('/market/providers');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // Providers don't change often
  });
}
