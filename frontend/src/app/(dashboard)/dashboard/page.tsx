/**
 * Dashboard Home Page
 * 
 * Shows real trading stats, recent analyses, and watchlist.
 */

'use client';

import { useAuth } from '@/hooks/useAuth';
import { useTradeStats } from '@/hooks/useTrades';
import { useStrategies } from '@/hooks/useStrategies';
import { useAnalyses } from '@/hooks/useAnalysis';
import { usePreferences } from '@/hooks/usePreferences';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { WatchlistPanel } from '@/components/dashboard/WatchlistPanel';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: tradeStats } = useTradeStats();
  const { data: strategies } = useStrategies();
  const { data: recentAnalyses } = useAnalyses({ limit: 5 });
  const { data: preferences } = usePreferences();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}
        </h2>
        <p className="mt-1 text-muted-foreground">
          Your AI-powered trading command center.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Trades"
          value={tradeStats?.totalTrades ?? '—'}
          icon="📊"
          subtitle={tradeStats?.openTrades ? `${tradeStats.openTrades} open` : undefined}
        />
        <StatsCard
          title="Win Rate"
          value={tradeStats ? `${tradeStats.winRate.toFixed(1)}%` : '—'}
          icon="🎯"
          trend={tradeStats && tradeStats.winRate > 50 ? 'up' : tradeStats?.winRate !== undefined ? 'down' : 'neutral'}
          trendValue={tradeStats ? `${tradeStats.winRate.toFixed(1)}%` : undefined}
        />
        <StatsCard
          title="Total P&L"
          value={tradeStats?.totalPnl ? (tradeStats.totalPnl > 0 ? `+${tradeStats.totalPnl.toFixed(2)}` : tradeStats.totalPnl.toFixed(2)) : '—'}
          icon="💰"
          trend={tradeStats?.totalPnl && tradeStats.totalPnl > 0 ? 'up' : tradeStats?.totalPnl !== undefined && tradeStats.totalPnl < 0 ? 'down' : 'neutral'}
        />
        <StatsCard
          title="Strategies"
          value={strategies?.length ?? '—'}
          icon="🎯"
          subtitle={preferences?.preferred_ai_provider ? `AI: ${preferences.preferred_ai_provider}` : undefined}
        />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Analyses */}
        <div className="lg:col-span-2 glass rounded-xl p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h3>
          {!recentAnalyses || recentAnalyses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No analyses yet.</p>
              <a href="/dashboard/analysis" className="text-sm text-primary hover:text-primary/80 mt-2 inline-block">
                Run your first analysis →
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAnalyses.map(analysis => (
                <div key={analysis.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground text-sm">{analysis.symbol}</span>
                    <span className="text-xs text-muted-foreground">{analysis.timeframe}</span>
                    {analysis.direction && (
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        analysis.direction === 'long' && 'bg-bullish/10 text-bullish',
                        analysis.direction === 'short' && 'bg-bearish/10 text-bearish',
                        analysis.direction === 'neutral' && 'bg-muted text-muted-foreground'
                      )}>
                        {analysis.direction}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{analysis.ai_provider}</span>
                    <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              <a href="/dashboard/history" className="block text-center text-sm text-primary hover:text-primary/80 pt-2">
                View all analyses →
              </a>
            </div>
          )}
        </div>

        {/* Watchlist Sidebar */}
        <div className="space-y-4">
          <WatchlistPanel />

          {/* Quick Actions */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <a href="/dashboard/analysis" className="block w-full rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 transition-colors text-center">
                🤖 Run Analysis
              </a>
              <a href="/dashboard/journal" className="block w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-center">
                📓 Open Trade
              </a>
              <a href="/dashboard/strategies" className="block w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors text-center">
                🎯 Manage Strategies
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <StatusDot label="Authentication" active />
            <StatusDot label="Database" active />
            <StatusDot label="Market Data" active />
            <StatusDot label="AI Engine" active={!!preferences?.preferred_ai_provider} />
          </div>
          <span className="text-xs text-muted-foreground">All systems operational</span>
        </div>
      </div>
    </div>
  );
}

function StatusDot({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn('h-2 w-2 rounded-full', active ? 'bg-bullish' : 'bg-muted-foreground')} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
