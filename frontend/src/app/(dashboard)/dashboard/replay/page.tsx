/**
 * Replay Mode Page
 * 
 * Navigate through past analyses chronologically.
 * Review what the AI said at each point in time.
 * Useful for learning and strategy validation.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAnalyses, AnalysisListItem } from '@/hooks/useAnalysis';
import { cn } from '@/lib/utils';

export default function ReplayPage() {
  const { data: allAnalyses, isLoading } = useAnalyses({ limit: 50 });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(3000);

  const analyses = allAnalyses?.slice().reverse() || []; // Oldest first
  const current = analyses[currentIndex];

  // Auto-play
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= analyses.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, analyses.length]);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, analyses.length - 1));
  }, [analyses.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const togglePlay = useCallback(() => {
    if (currentIndex >= analyses.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying((p) => !p);
  }, [currentIndex, analyses.length]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!analyses || analyses.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Replay Mode</h2>
          <p className="mt-1 text-muted-foreground">Review past AI analyses chronologically.</p>
        </div>
        <div className="glass rounded-xl p-8 text-center">
          <p className="text-lg font-medium text-foreground mb-2">No analyses to replay</p>
          <p className="text-sm text-muted-foreground">
            Run some AI analyses first, then come back to review them step by step.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Replay Mode</h2>
          <p className="mt-1 text-muted-foreground">
            Navigate through {analyses.length} analyses chronologically.
          </p>
        </div>

        {/* Timeline indicator */}
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-mono">{currentIndex + 1}</span>
          <span> / {analyses.length}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / analyses.length) * 100}%` }}
          />
        </div>

        {/* Timeline dots */}
        <div className="absolute top-0 left-0 right-0 h-2 flex items-center">
          {analyses.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
              className={cn(
                'absolute h-3 w-3 rounded-full border-2 transition-all',
                i === currentIndex
                  ? 'bg-primary border-primary scale-125'
                  : i < currentIndex
                  ? 'bg-primary/50 border-primary/50'
                  : 'bg-muted border-muted'
              )}
              style={{ left: `${(i / (analyses.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
            />
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Analysis Detail */}
        <div className="lg:col-span-2 glass rounded-xl p-6 animate-fade-in" key={current?.id}>
          {current ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-foreground">{current.symbol}</span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {current.timeframe}
                  </span>
                  {current.direction && (
                    <span className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      current.direction === 'long' && 'bg-bullish/10 text-bullish',
                      current.direction === 'short' && 'bg-bearish/10 text-bearish',
                      current.direction === 'neutral' && 'bg-muted text-muted-foreground'
                    )}>
                      {current.direction.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {new Date(current.created_at).toLocaleString()}
                </span>
              </div>

              {/* Trade Levels */}
              {(current.entry_price || current.stop_loss || current.take_profit_1) && (
                <div className="grid grid-cols-4 gap-3">
                  <LevelBox label="Entry" value={current.entry_price} color="blue" />
                  <LevelBox label="Stop Loss" value={current.stop_loss} color="red" />
                  <LevelBox label="TP 1" value={current.take_profit_1} color="green" />
                  <LevelBox label="Confidence" value={current.confidence_score ? `${(current.confidence_score * 100).toFixed(0)}%` : null} color="blue" />
                </div>
              )}

              {/* AI Reasoning */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">AI Reasoning</h4>
                <div className="rounded-lg bg-muted/30 p-4 text-sm text-foreground max-h-80 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {current.reasoning}
                </div>
              </div>

              {/* Provider info */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                <span>Provider: {current.ai_provider}</span>
                <span>Model: {current.ai_model}</span>
                <span>Type: {current.analysis_type}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No analysis selected
            </div>
          )}
        </div>

        {/* Sidebar — Controls & Thumbnails */}
        <div className="space-y-4">
          {/* Playback Controls */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Playback</h3>
            
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={goPrev}
                disabled={currentIndex === 0}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-30 transition-colors"
              >
                ◀
              </button>
              <button
                onClick={togglePlay}
                className={cn(
                  'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isPlaying ? 'bg-bearish/20 text-bearish' : 'bg-primary text-primary-foreground hover:bg-primary/90'
                )}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={goNext}
                disabled={currentIndex >= analyses.length - 1}
                className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-30 transition-colors"
              >
                ▶
              </button>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Speed</label>
              <select
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm text-foreground"
              >
                <option value={5000}>Slow (5s)</option>
                <option value={3000}>Normal (3s)</option>
                <option value={1500}>Fast (1.5s)</option>
                <option value={800}>Very Fast (0.8s)</option>
              </select>
            </div>
          </div>

          {/* Analysis List */}
          <div className="glass rounded-xl p-4 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-semibold text-foreground mb-3">All Analyses</h3>
            <div className="space-y-1">
              {analyses.map((analysis, i) => (
                <button
                  key={analysis.id}
                  onClick={() => { setCurrentIndex(i); setIsPlaying(false); }}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-2 text-xs transition-colors',
                    i === currentIndex
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-muted/50 text-muted-foreground'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{analysis.symbol}</span>
                    <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span>{analysis.timeframe}</span>
                    {analysis.direction && (
                      <span className={cn(
                        'rounded px-1 py-0.5',
                        analysis.direction === 'long' && 'text-bullish',
                        analysis.direction === 'short' && 'text-bearish'
                      )}>
                        {analysis.direction}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Level Box Component
// ──────────────────────────────────────────────

function LevelBox({ label, value, color }: { label: string; value: number | string | null; color: 'blue' | 'red' | 'green' }) {
  const colorClasses = {
    blue: 'text-primary',
    red: 'text-bearish',
    green: 'text-bullish',
  };

  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn('text-sm font-mono font-medium mt-1', value ? colorClasses[color] : 'text-muted-foreground')}>
        {value !== null && value !== undefined ? value : '—'}
      </div>
    </div>
  );
}
