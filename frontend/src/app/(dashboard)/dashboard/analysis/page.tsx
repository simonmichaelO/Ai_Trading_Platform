/**
 * AI Analysis Page
 * 
 * Run AI analyses with:
 * - Market data analysis (text only)
 * - Vision analysis (chart screenshot)
 * - Hybrid analysis (data + chart)
 * 
 * Shows live chart + AI results side by side.
 */

'use client';

import { useState } from 'react';
import { useCreateAnalysis, useAnalyses, useAIProviders, AnalysisResult } from '@/hooks/useAnalysis';
import { useStrategies } from '@/hooks/useStrategies';
import { useCandles } from '@/hooks/useMarketData';
import { ImageUpload } from '@/components/charts/ImageUpload';
import { PriceChart } from '@/components/charts/PriceChart';
import { useToast } from '@/components/shared/Toast';
import { cn } from '@/lib/utils';

export default function AnalysisPage() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [timeframe, setTimeframe] = useState('4h');
  const [provider, setProvider] = useState('openai');
  const [analysisType, setAnalysisType] = useState('data');
  const [strategyId, setStrategyId] = useState<string>('');
  const [chartImage, setChartImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');

  const createMutation = useCreateAnalysis();
  const { data: analyses } = useAnalyses({ limit: 10 });
  const { data: aiProviders } = useAIProviders();
  const { data: strategies } = useStrategies(true);
  const { data: candleData } = useCandles(symbol, timeframe, 100);
  const { toast } = useToast();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);

    try {
      const res = await createMutation.mutateAsync({
        symbol: symbol.toUpperCase(),
        timeframe,
        provider,
        analysis_type: analysisType,
        strategy_id: strategyId || undefined,
        chart_image: chartImage || undefined,
      });

      setResult(res);
      toast.success('Analysis complete!');
    } catch {
      toast.error('Analysis failed. Check your AI API keys.');
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">AI Analysis</h2>
        <p className="mt-1 text-muted-foreground">
          Run AI-powered market analysis with live data and chart vision.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['new', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {tab === 'new' ? 'New Analysis' : 'History'}
          </button>
        ))}
      </div>

      {activeTab === 'new' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left — Configuration + Chart */}
          <div className="space-y-4">
            {/* Config Form */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Configure Analysis</h3>
              
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">Symbol</label>
                    <input
                      type="text"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      placeholder="BTC/USDT"
                      required
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Timeframe</label>
                    <select
                      value={timeframe}
                      onChange={(e) => setTimeframe(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {['5m', '15m', '30m', '1h', '4h', '1d'].map(tf => (
                        <option key={tf} value={tf}>{tf}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-foreground">AI Provider</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      {aiProviders?.filter(p => p.available).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      )) || (
                        <>
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="gemini">Gemini</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">Analysis Type</label>
                    <select
                      value={analysisType}
                      onChange={(e) => setAnalysisType(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="data">Data Analysis</option>
                      <option value="vision">Vision (Chart)</option>
                      <option value="hybrid">Hybrid (Data + Chart)</option>
                    </select>
                  </div>
                </div>

                {strategies && strategies.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Strategy</label>
                    <select
                      value={strategyId}
                      onChange={(e) => setStrategyId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                    >
                      <option value="">Auto (use default)</option>
                      {strategies.map(s => (
                        <option key={s.id} value={s.id}>{s.name}{s.is_default ? ' (default)' : ''}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Chart Image Upload (for vision/hybrid) */}
                {analysisType !== 'data' && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Chart Screenshot (optional)
                    </label>
                    <ImageUpload
                      onImageUpload={setChartImage}
                      onImageRemove={() => setChartImage(null)}
                      currentImage={chartImage}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className={cn(
                    'w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors',
                    'bg-primary text-primary-foreground hover:bg-primary/90',
                    'disabled:opacity-50'
                  )}
                >
                  {createMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Analyzing...
                    </span>
                  ) : (
                    '🤖 Run Analysis'
                  )}
                </button>
              </form>
            </div>

            {/* Live Chart */}
            <div className="glass rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {symbol} — {timeframe}
              </h3>
              {candleData && candleData.candles.length > 0 ? (
                <PriceChart
                  candles={candleData.candles}
                  entry={result?.ai.structured.entry_price}
                  stopLoss={result?.ai.structured.stop_loss}
                  takeProfit={result?.ai.structured.take_profit_1}
                  height={300}
                />
              ) : (
                <div className="flex items-center justify-center h-[300px] bg-muted/20 rounded-lg">
                  <p className="text-sm text-muted-foreground">Loading chart data...</p>
                </div>
              )}
            </div>
          </div>

          {/* Right — Results */}
          <div className="glass rounded-xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Analysis Result</h3>
            
            {!result && !createMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">🧠</span>
                <p className="text-muted-foreground">
                  Configure and run an analysis to see results here.
                </p>
              </div>
            )}

            {createMutation.isPending && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent mb-4" />
                <p className="text-sm text-muted-foreground">AI is analyzing...</p>
                <p className="text-xs text-muted-foreground mt-1">This may take 10-30 seconds</p>
              </div>
            )}

            {result && (
              <div className="space-y-4">
                {/* Direction & Confidence */}
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'rounded-lg px-4 py-2 text-sm font-bold',
                    result.ai.structured.direction === 'long' && 'bg-bullish/20 text-bullish',
                    result.ai.structured.direction === 'short' && 'bg-bearish/20 text-bearish',
                    result.ai.structured.direction === 'neutral' && 'bg-muted text-muted-foreground'
                  )}>
                    {result.ai.structured.direction.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence: <span className="text-foreground font-medium">
                      {(result.ai.structured.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Trade Levels */}
                <div className="grid grid-cols-2 gap-3">
                  <LevelCard label="Entry" value={result.ai.structured.entry_price} />
                  <LevelCard label="Stop Loss" value={result.ai.structured.stop_loss} color="bearish" />
                  <LevelCard label="TP 1" value={result.ai.structured.take_profit_1} color="bullish" />
                  <LevelCard label="TP 2" value={result.ai.structured.take_profit_2} color="bullish" />
                </div>

                {/* AI Info */}
                <div className="text-xs text-muted-foreground border-t border-border pt-3">
                  <span>{result.ai.provider}</span> · <span>{result.ai.model}</span> · <span>{result.ai.usage.totalTokens} tokens</span>
                </div>

                {/* Reasoning */}
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">AI Reasoning</h4>
                  <div className="rounded-lg bg-muted/50 p-4 text-sm text-foreground max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {result.ai.structured.reasoning_summary || result.analysis.reasoning.substring(0, 1000)}
                  </div>
                </div>

                {/* Key Levels */}
                {result.ai.structured.key_levels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Key Levels</h4>
                    <div className="space-y-1">
                      {result.ai.structured.key_levels.map((level, i) => (
                        <div key={i} className="flex items-center justify-between text-xs rounded-md bg-muted/30 px-3 py-1.5">
                          <span className="text-muted-foreground capitalize">{level.type}</span>
                          <span className="font-mono text-foreground">{level.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Recent Analyses</h3>
          {!analyses || analyses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No analyses yet. Run your first analysis above.
            </p>
          ) : (
            <div className="space-y-2">
              {analyses.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-4 py-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-foreground">{item.symbol}</span>
                    <span className="text-xs text-muted-foreground">{item.timeframe}</span>
                    {item.direction && (
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        item.direction === 'long' && 'bg-bullish/10 text-bullish',
                        item.direction === 'short' && 'bg-bearish/10 text-bearish'
                      )}>
                        {item.direction}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{item.ai_provider}</span>
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LevelCard({ label, value, color }: { label: string; value: number | null; color?: 'bullish' | 'bearish' }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={cn(
        'text-sm font-mono font-medium',
        !value && 'text-muted-foreground',
        color === 'bullish' && 'text-bullish',
        color === 'bearish' && 'text-bearish',
        !color && value && 'text-foreground'
      )}>
        {value ? value.toFixed(value >= 1 ? 2 : 5) : '—'}
      </div>
    </div>
  );
}
