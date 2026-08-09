/**
 * Analysis History Page
 * 
 * Browse all past AI analyses with filtering and detail view.
 */

'use client';

import { useState } from 'react';
import { useAnalyses, useDeleteAnalysis, AnalysisListItem } from '@/hooks/useAnalysis';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const [page, setPage] = useState(1);
  const [symbolFilter, setSymbolFilter] = useState('');
  const { data: analyses, isLoading } = useAnalyses({ page, limit: 20, symbol: symbolFilter || undefined });
  const deleteMutation = useDeleteAnalysis();
  const { toast } = useToast();
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisListItem | null>(null);

  async function handleDelete(id: string) {
    if (!confirm('Delete this analysis?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Analysis deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Analysis History</h2>
        <p className="mt-1 text-muted-foreground">Browse all your past AI market analyses.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          value={symbolFilter}
          onChange={e => setSymbolFilter(e.target.value)}
          placeholder="Filter by symbol..."
          className="rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none w-48"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2 glass rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : !analyses || analyses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No analyses found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {analyses.map(analysis => (
                <div
                  key={analysis.id}
                  className={cn(
                    'px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer',
                    selectedAnalysis?.id === analysis.id && 'bg-muted/50'
                  )}
                  onClick={() => setSelectedAnalysis(analysis)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{analysis.symbol}</span>
                      <span className="text-xs text-muted-foreground">{analysis.timeframe}</span>
                      {analysis.direction && (
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          analysis.direction === 'long' && 'bg-bullish/10 text-bullish',
                          analysis.direction === 'short' && 'bg-bearish/10 text-bearish',
                          analysis.direction === 'neutral' && 'bg-muted text-muted-foreground'
                        )}>
                          {analysis.direction.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{analysis.ai_provider}</span>
                      {analysis.confidence_score && (
                        <span>{(analysis.confidence_score * 100).toFixed(0)}%</span>
                      )}
                      <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {analysis.entry_price && (
                    <div className="mt-1 flex gap-4 text-xs text-muted-foreground">
                      <span>Entry: <span className="text-foreground font-mono">{analysis.entry_price}</span></span>
                      {analysis.stop_loss && <span>SL: <span className="text-bearish font-mono">{analysis.stop_loss}</span></span>}
                      {analysis.take_profit_1 && <span>TP: <span className="text-bullish font-mono">{analysis.take_profit_1}</span></span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {analyses && analyses.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30"
              >
                ← Previous
              </button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                className="rounded-lg border border-border px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="glass rounded-xl p-5">
          {!selectedAnalysis ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">Select an analysis to view details</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{selectedAnalysis.symbol}</h3>
                <button
                  onClick={() => handleDelete(selectedAnalysis.id)}
                  className="text-xs text-destructive hover:text-destructive/80"
                >
                  Delete
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground">Timeframe:</span> <span className="text-foreground">{selectedAnalysis.timeframe}</span></div>
                <div><span className="text-muted-foreground">Provider:</span> <span className="text-foreground">{selectedAnalysis.ai_provider}</span></div>
                <div><span className="text-muted-foreground">Model:</span> <span className="text-foreground">{selectedAnalysis.ai_model}</span></div>
                <div><span className="text-muted-foreground">Type:</span> <span className="text-foreground capitalize">{selectedAnalysis.analysis_type}</span></div>
              </div>

              {selectedAnalysis.confidence_score && (
                <div>
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${selectedAnalysis.confidence_score * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-foreground">{(selectedAnalysis.confidence_score * 100).toFixed(0)}%</span>
                </div>
              )}

              {/* Reasoning */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">AI Reasoning</h4>
                <div className="rounded-lg bg-muted/50 p-3 text-sm text-foreground max-h-80 overflow-y-auto whitespace-pre-wrap">
                  {selectedAnalysis.reasoning}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {new Date(selectedAnalysis.created_at).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
