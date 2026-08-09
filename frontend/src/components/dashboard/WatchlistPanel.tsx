/**
 * Watchlist Panel — Live prices widget for the dashboard sidebar.
 */

'use client';

import { useBatchPrices } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';

const DEFAULT_SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'EUR/USD', 'GBP/USD'];

export function WatchlistPanel({ symbols }: { symbols?: string[] }) {
  const displaySymbols = symbols && symbols.length > 0 ? symbols : DEFAULT_SYMBOLS;
  const { data: prices, isLoading } = useBatchPrices(displaySymbols);

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Watchlist</h3>
        <div className="space-y-2">
          {displaySymbols.map((_, i) => (
            <div key={i} className="h-12 rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Watchlist</h3>
      <div className="space-y-2">
        {!prices || prices.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            No price data available
          </p>
        ) : (
          prices.map((price) => (
            <div key={price.symbol} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors">
              <div>
                <span className="text-sm font-medium text-foreground">{price.symbol}</span>
                <span className="ml-2 text-xs text-muted-foreground uppercase">{price.market_type}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-mono text-foreground">
                  {formatPrice(price.price, price.market_type)}
                </div>
                <div className={cn(
                  'text-xs font-medium',
                  price.change_24h >= 0 ? 'text-bullish' : 'text-bearish'
                )}>
                  {price.change_24h >= 0 ? '+' : ''}{price.change_24h.toFixed(2)}%
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatPrice(price: number, marketType: string): string {
  if (marketType === 'crypto') {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(4)}`;
  }
  if (marketType === 'forex') return price.toFixed(5);
  return `$${price.toFixed(2)}`;
}
