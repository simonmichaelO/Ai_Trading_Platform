/**
 * Settings Page
 * 
 * User preferences and account settings.
 * Allows changing default timeframe, market type, AI provider, and risk settings.
 */

'use client';

import { useState, useEffect } from 'react';
import { usePreferences, useUpdatePreferences, UserPreferences } from '@/hooks/usePreferences';
import { cn } from '@/lib/utils';

const TIMEFRAMES = ['5m', '15m', '30m', '1h', '4h', '1d', '1w'];
const MARKET_TYPES = ['forex', 'crypto', 'stocks', 'indices', 'commodities'];
const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI (GPT-4o)' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'gemini', label: 'Google (Gemini)' },
];

export default function SettingsPage() {
  const { data: preferences, isLoading } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const [saved, setSaved] = useState(false);

  // Local form state — initialized from preferences
  const [timeframe, setTimeframe] = useState('4h');
  const [marketType, setMarketType] = useState('forex');
  const [aiProvider, setAiProvider] = useState('openai');
  const [riskPercent, setRiskPercent] = useState('1');
  const [rrRatio, setRrRatio] = useState('2');

  // Sync local state with server data
  useEffect(() => {
    if (preferences) {
      setTimeframe(preferences.default_timeframe);
      setMarketType(preferences.default_market_type);
      setAiProvider(preferences.preferred_ai_provider);
      setRiskPercent(String(preferences.default_risk_percent));
      setRrRatio(String(preferences.default_rr_ratio));
    }
  }, [preferences]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    await updateMutation.mutateAsync({
      default_timeframe: timeframe,
      default_market_type: marketType,
      preferred_ai_provider: aiProvider,
      default_risk_percent: parseFloat(riskPercent) || 1,
      default_rr_ratio: parseFloat(rrRatio) || 2,
    });

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="mt-1 text-muted-foreground">
          Configure your default analysis parameters and preferences.
        </p>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Default Analysis Settings */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Default Analysis Settings
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {/* Default Timeframe */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Default Timeframe
              </label>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {TIMEFRAMES.map((tf) => (
                  <option key={tf} value={tf}>{tf}</option>
                ))}
              </select>
            </div>

            {/* Default Market Type */}
            <div>
              <label className="text-sm font-medium text-foreground">
                Default Market
              </label>
              <select
                value={marketType}
                onChange={(e) => setMarketType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              >
                {MARKET_TYPES.map((mt) => (
                  <option key={mt} value={mt}>{mt.charAt(0).toUpperCase() + mt.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Settings */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            AI Provider
          </h3>
          <div>
            <label className="text-sm font-medium text-foreground">
              Preferred AI Provider
            </label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
              className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-muted-foreground">
              This is used by default for new analyses. You can switch providers per analysis.
            </p>
          </div>
        </div>

        {/* Risk Management */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Risk Management Defaults
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-foreground">
                Default Risk per Trade (%)
              </label>
              <input
                type="number"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                min="0.1"
                max="10"
                step="0.1"
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Default Risk:Reward Ratio
              </label>
              <input
                type="number"
                value={rrRatio}
                onChange={(e) => setRrRatio(e.target.value)}
                min="1"
                max="20"
                step="0.5"
                className="mt-1 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className={cn(
              'rounded-lg px-6 py-2 text-sm font-medium transition-colors',
              saved
                ? 'bg-bullish text-white'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
              'disabled:opacity-50'
            )}
          >
            {updateMutation.isPending ? 'Saving...' : saved ? '✓ Saved' : 'Save Settings'}
          </button>

          {updateMutation.isError && (
            <p className="text-sm text-destructive">
              Failed to save. Please try again.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
