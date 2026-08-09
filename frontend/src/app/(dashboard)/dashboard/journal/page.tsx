/**
 * Trading Journal Page
 * 
 * View all trades, open new positions, close existing ones.
 * Shows stats at the top and trade list below.
 */

'use client';

import { useState } from 'react';
import { useTrades, useTradeStats, useCreateTrade, useUpdateTrade, useDeleteTrade, Trade } from '@/hooks/useTrades';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

export default function JournalPage() {
  const { data: trades, isLoading } = useTrades({ limit: 50 });
  const { data: stats } = useTradeStats();
  const createMutation = useCreateTrade();
  const updateMutation = useUpdateTrade();
  const deleteMutation = useDeleteTrade();
  const { toast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ symbol: '', direction: 'long' as 'long' | 'short', entry_price: '', stop_loss: '', take_profit: '', notes: '' });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        symbol: form.symbol,
        direction: form.direction,
        entry_price: parseFloat(form.entry_price),
        stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : undefined,
        take_profit: form.take_profit ? parseFloat(form.take_profit) : undefined,
        notes: form.notes || undefined,
      });
      toast.success('Trade opened!');
      setShowForm(false);
      setForm({ symbol: '', direction: 'long', entry_price: '', stop_loss: '', take_profit: '', notes: '' });
    } catch {
      toast.error('Failed to open trade.');
    }
  }

  async function handleClose(trade: Trade, exitPrice: number) {
    try {
      const pnl = trade.direction === 'long'
        ? exitPrice - trade.entry_price
        : trade.entry_price - exitPrice;
      
      await updateMutation.mutateAsync({
        id: trade.id,
        status: 'closed',
        exit_price: exitPrice,
        pnl,
        outcome: pnl > 0 ? 'win' : pnl < 0 ? 'loss' : 'breakeven',
      });
      toast.success('Trade closed.');
    } catch {
      toast.error('Failed to close trade.');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this trade?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Trade deleted.');
    } catch {
      toast.error('Failed to delete trade.');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Trading Journal</h2>
          <p className="mt-1 text-muted-foreground">Track your trades and performance.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Open Trade'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Total Trades" value={stats?.totalTrades ?? '—'} icon="📊" />
        <StatsCard title="Open Positions" value={stats?.openTrades ?? '—'} icon="🔵" />
        <StatsCard title="Win Rate" value={stats ? `${stats.winRate.toFixed(1)}%` : '—'} icon="🎯" />
        <StatsCard title="Total P&L" value={stats?.totalPnl ? stats.totalPnl.toFixed(2) : '—'} icon="💰" />
      </div>

      {/* New Trade Form */}
      {showForm && (
        <div className="glass rounded-xl p-6 animate-fade-in">
          <h3 className="text-lg font-semibold text-foreground mb-4">Open New Trade</h3>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">Symbol</label>
              <input
                type="text"
                value={form.symbol}
                onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
                placeholder="BTC/USDT"
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Direction</label>
              <select
                value={form.direction}
                onChange={e => setForm(f => ({ ...f, direction: e.target.value as 'long' | 'short' }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                <option value="long">Long</option>
                <option value="short">Short</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Entry Price</label>
              <input
                type="number"
                value={form.entry_price}
                onChange={e => setForm(f => ({ ...f, entry_price: e.target.value }))}
                step="any"
                required
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Stop Loss</label>
              <input
                type="number"
                value={form.stop_loss}
                onChange={e => setForm(f => ({ ...f, stop_loss: e.target.value }))}
                step="any"
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Take Profit</label>
              <input
                type="number"
                value={form.take_profit}
                onChange={e => setForm(f => ({ ...f, take_profit: e.target.value }))}
                step="any"
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Opening...' : 'Open Trade'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trade List */}
      <div className="glass rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : !trades || trades.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trades yet. Open your first trade above.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Symbol</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Direction</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Entry</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">P&L</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(trade => (
                  <TradeRow
                    key={trade.id}
                    trade={trade}
                    onClose={handleClose}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Trade Row
// ──────────────────────────────────────────────

function TradeRow({ trade, onClose, onDelete }: {
  trade: Trade;
  onClose: (trade: Trade, exitPrice: number) => void;
  onDelete: (id: string) => void;
}) {
  const [exitInput, setExitInput] = useState('');
  const [showClose, setShowClose] = useState(false);

  return (
    <tr className="border-b border-border/50 hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3 font-medium text-foreground">{trade.symbol}</td>
      <td className="px-4 py-3">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          trade.direction === 'long' ? 'bg-bullish/10 text-bullish' : 'bg-bearish/10 text-bearish'
        )}>
          {trade.direction.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-right font-mono text-foreground">{trade.entry_price}</td>
      <td className={cn(
        'px-4 py-3 text-right font-mono',
        trade.pnl === null ? 'text-muted-foreground' :
        trade.pnl > 0 ? 'text-bullish' : trade.pnl < 0 ? 'text-bearish' : 'text-foreground'
      )}>
        {trade.pnl !== null ? `${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}` : '—'}
      </td>
      <td className="px-4 py-3">
        <span className={cn(
          'rounded-full px-2 py-0.5 text-xs',
          trade.status === 'open' && 'bg-primary/10 text-primary',
          trade.status === 'closed' && 'bg-muted text-muted-foreground',
          trade.status === 'cancelled' && 'bg-destructive/10 text-destructive'
        )}>
          {trade.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {new Date(trade.opened_at).toLocaleDateString()}
      </td>
      <td className="px-4 py-3 text-right">
        {trade.status === 'open' && !showClose && (
          <button
            onClick={() => setShowClose(true)}
            className="text-xs text-primary hover:text-primary/80 mr-3"
          >
            Close
          </button>
        )}
        {showClose && (
          <div className="inline-flex items-center gap-1">
            <input
              type="number"
              value={exitInput}
              onChange={e => setExitInput(e.target.value)}
              placeholder="Exit price"
              className="w-24 rounded border border-input bg-background px-2 py-1 text-xs"
              step="any"
            />
            <button
              onClick={() => { onClose(trade, parseFloat(exitInput)); setShowClose(false); }}
              className="text-xs text-bullish hover:text-bullish/80"
              disabled={!exitInput}
            >
              ✓
            </button>
            <button onClick={() => setShowClose(false)} className="text-xs text-muted-foreground">✕</button>
          </div>
        )}
        <button
          onClick={() => onDelete(trade.id)}
          className="text-xs text-destructive hover:text-destructive/80 ml-3"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
