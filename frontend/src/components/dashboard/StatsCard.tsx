/**
 * Stats Card Component — Reusable stat display for dashboard.
 */

import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: string;
  className?: string;
}

export function StatsCard({ title, value, subtitle, trend, trendValue, icon, className }: StatsCardProps) {
  return (
    <div className={cn('glass rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{title}</span>
        {icon && <span className="text-lg">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-foreground font-mono">{value}</span>
        {trend && trendValue && (
          <span className={cn(
            'text-xs font-medium',
            trend === 'up' && 'text-bullish',
            trend === 'down' && 'text-bearish',
            trend === 'neutral' && 'text-muted-foreground'
          )}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
          </span>
        )}
      </div>
      {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
