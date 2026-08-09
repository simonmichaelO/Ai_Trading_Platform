/**
 * Market Overview Page
 * 
 * Displays live prices for major crypto, forex, and stock assets.
 * Auto-refreshes every 30 seconds.
 */

'use client';

import { useState } from 'react';
import { useBatchPrices, useProviders } from '@/hooks/useMarketData';
import { MarketCard } from '@/components/dashboard/MarketCard';

// Default symbols to display
const DEFAULT_SYMBOLS = [
  // Crypto
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT',
  // Forex
  'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
  // Indices
  'SPX500', 'NASDAQ',
];

type MarketFilter = 'all' | 'crypto' | 'forex' | 'stocks' | 'indices';

export default function MarketPage() {
  const [filter, setFilter] = useState<MarketFilter>('all');
  const { data: prices, isLoading, error, refetch } = useBatchPrices(DEFAULT_SYMBOLS);
  const { data: providers } = useProviders();

  // Filter prices by market type
  const filteredPrices = prices?.filter(p => {
    if (filter === 'all') return true;
    return p.market_type === filter;
  }) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Market Overview</h2>
          <p className="mt-1 text-muted-foreground">
            Live prices across crypto, forex, and indices.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'crypto', 'forex', 'indices'] as MarketFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Provider Status */}
      {providers && (
        <div className="flex gap-3 text-xs text-muted-foreground">
          {providers.map((p) => (
            <span key={p.name} className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-bullish" />
              {p.name}
            </span>
          ))}
        </div>
      )}

      {/* Price Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Fetching live prices...</p>
          </div>
        </div>
      ) : error ? (
        <div className="glass rounded-xl p-6 text-center">
          <p className="text-destructive mb-2">Failed to fetch market data</p>
          <p className="text-sm text-muted-foreground">
            Check that the market data providers are accessible.
            Crypto and forex work without API keys.
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPrices.map((priceData) => (
            <MarketCard key={priceData.symbol} data={priceData} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && filteredPrices.length === 0 && (
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-lg font-medium text-foreground mb-2">No data for this filter</p>
          <p className="text-sm text-muted-foreground">
            {filter === 'stocks' || filter === 'indices'
              ? 'Stocks data requires an Alpha Vantage API key. Set ALPHAVANTAGE_API_KEY in backend/.env'
              : 'No data available. Try a different filter.'}
          </p>
        </div>
      )}
    </div>
  );
}
