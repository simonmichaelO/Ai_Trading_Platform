/**
 * Market Card Component
 * 
 * Displays a single asset's price information.
 * Shows symbol, price, 24h change, and mini sparkline.
 * 
 * Used in: Market overview page, watchlist sidebar
 */

'use client';

import { cn } from '@/lib/utils';
import type { PriceData } from '@/hooks/useMarketData';

interface MarketCardProps {
  data: PriceData;
  onClick?: () => void;
}

export function MarketCard({ data, onClick }: MarketCardProps) {
  const isPositive = data.change_24h >= 0;

  return (
    <button
      onClick={onClick}
      className={cn(
        'glass rounded-xl p-4 text-left transition-all w-full',
        'hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5',
        onClick && 'cursor-pointer'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        {/* Symbol & Market Type */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{data.symbol}</span>
          <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground uppercase">
            {data.market_type}
          </span>
        </div>

        {/* Change Badge */}
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            isPositive
              ? 'bg-bullish/10 text-bullish'
              : 'bg-bearish/10 text-bearish'
          )}
        >
          {isPositive ? '+' : ''}{data.change_24h.toFixed(2)}%
        </span>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-2">
        <span className="text-xl font-bold text-foreground font-mono">
          {formatPrice(data.price, data.market_type)}
        </span>
        <span
          className={cn(
            'text-sm',
            isPositive ? 'text-bullish' : 'text-bearish'
          )}
        >
          {isPositive ? '▲' : '▼'} {formatPrice(Math.abs(data.change_24h_abs), data.market_type)}
        </span>
      </div>

      {/* High / Low */}
      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>H: {formatPrice(data.high_24h, data.market_type)}</span>
        <span>L: {formatPrice(data.low_24h, data.market_type)}</span>
      </div>
    </button>
  );
}

// ──────────────────────────────────────────────
// Formatting Helpers
// ──────────────────────────────────────────────

function formatPrice(price: number, marketType: string): string {
  if (marketType === 'crypto') {
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  }

  if (marketType === 'forex') {
    return price.toFixed(5);
  }

  // Stocks / indices
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  return `$${price.toFixed(2)}`;
}
