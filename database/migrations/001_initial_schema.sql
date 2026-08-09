-- ============================================
-- AI Trading Platform — Initial Database Schema
-- ============================================
-- Migration: 001_initial_schema.sql
-- Purpose: Create all core tables for the platform
-- Database: Supabase PostgreSQL
-- 
-- IMPORTANT: Run this in Supabase SQL Editor
-- Go to: Supabase Dashboard → SQL Editor → New Query → Paste this file → Run

-- ============================================
-- 1. STRATEGIES TABLE
-- ============================================
-- Stores user-defined trading strategies that AI uses during analysis.

CREATE TABLE IF NOT EXISTS strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Strategy rules as JSONB for flexibility
  entry_rules JSONB DEFAULT '[]'::jsonb,
  exit_rules JSONB DEFAULT '[]'::jsonb,
  risk_rules JSONB DEFAULT '[]'::jsonb,
  indicators JSONB DEFAULT '[]'::jsonb,
  
  -- AI prompt template for this strategy
  prompt_template TEXT,
  
  -- State
  is_enabled BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying user's strategies
CREATE INDEX idx_strategies_user_id ON strategies(user_id);
CREATE INDEX idx_strategies_enabled ON strategies(user_id, is_enabled);

-- ============================================
-- 2. ANALYSES TABLE
-- ============================================
-- Stores every AI analysis performed. This is the core record of the platform.

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What was analyzed
  symbol TEXT NOT NULL,              -- e.g., 'EUR/USD', 'BTC/USDT'
  timeframe TEXT NOT NULL,           -- e.g., '1h', '4h', '1d'
  market_type TEXT NOT NULL,         -- 'forex', 'crypto', 'stocks', 'indices'
  
  -- Market snapshot (price data at time of analysis)
  market_snapshot JSONB NOT NULL,    -- OHLCV data, indicators, etc.
  
  -- AI analysis results
  ai_provider TEXT NOT NULL,         -- 'openai', 'anthropic', 'gemini'
  ai_model TEXT NOT NULL,            -- 'gpt-4o', 'claude-3-5-sonnet', etc.
  analysis_type TEXT NOT NULL,       -- 'data', 'vision', 'hybrid'
  reasoning TEXT NOT NULL,           -- Full AI reasoning/analysis text
  confidence_score DECIMAL(3,2),     -- 0.00 to 1.00
  
  -- Chart analysis results (from vision analysis)
  chart_annotations JSONB,           -- Detected patterns, levels, etc.
  annotated_chart_url TEXT,          -- URL to the annotated chart image
  
  -- Trade levels
  entry_price DECIMAL(16,8),
  stop_loss DECIMAL(16,8),
  take_profit_1 DECIMAL(16,8),
  take_profit_2 DECIMAL(16,8),
  take_profit_3 DECIMAL(16,8),
  direction TEXT,                    -- 'long', 'short', 'neutral'
  
  -- Strategy used
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  
  -- Original chart image URL
  chart_image_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_symbol ON analyses(user_id, symbol);
CREATE INDEX idx_analyses_created ON analyses(user_id, created_at DESC);
CREATE INDEX idx_analyses_strategy ON analyses(strategy_id);

-- ============================================
-- 3. TRADES TABLE (Trading Journal)
-- ============================================
-- Tracks actual trades and their outcomes. Linked to analyses when applicable.

CREATE TABLE IF NOT EXISTS trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Link to the analysis that generated this trade
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
  
  -- Trade details
  symbol TEXT NOT NULL,
  direction TEXT NOT NULL,            -- 'long' or 'short'
  entry_price DECIMAL(16,8) NOT NULL,
  stop_loss DECIMAL(16,8),
  take_profit DECIMAL(16,8),
  
  -- Outcome
  status TEXT DEFAULT 'open',         -- 'open', 'closed', 'cancelled'
  exit_price DECIMAL(16,8),
  pnl DECIMAL(16,8),                 -- Profit/Loss in pips or points
  pnl_percent DECIMAL(8,4),          -- P&L as percentage
  outcome TEXT,                       -- 'win', 'loss', 'breakeven'
  
  -- Risk management
  risk_reward_ratio DECIMAL(8,2),
  position_size DECIMAL(16,4),
  
  -- Notes & tags
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Emotional state / journal
  emotional_state TEXT,               -- 'confident', 'fearful', 'greedy', etc.
  lessons_learned TEXT,
  
  -- Timestamps
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for journal queries
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(user_id, status);
CREATE INDEX idx_trades_symbol ON trades(user_id, symbol);
CREATE INDEX idx_trades_opened ON trades(user_id, opened_at DESC);
CREATE INDEX idx_trades_strategy ON trades(strategy_id);

-- ============================================
-- 4. WATCHLIST TABLE
-- ============================================
-- User's monitored symbols/pairs.

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  market_type TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one entry per symbol per user
  UNIQUE(user_id, symbol)
);

CREATE INDEX idx_watchlist_user ON watchlist(user_id, is_active);

-- ============================================
-- 5. USER PREFERENCES TABLE
-- ============================================
-- Stores user-specific settings and preferences.

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Display preferences
  theme TEXT DEFAULT 'dark',
  default_timeframe TEXT DEFAULT '4h',
  default_market_type TEXT DEFAULT 'forex',
  
  -- AI preferences
  preferred_ai_provider TEXT DEFAULT 'openai',
  preferred_ai_model TEXT DEFAULT 'gpt-4o',
  
  -- Notification preferences
  notifications JSONB DEFAULT '{}'::jsonb,
  
  -- Risk defaults
  default_risk_percent DECIMAL(5,2) DEFAULT 1.00,
  default_rr_ratio DECIMAL(5,2) DEFAULT 2.00,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. MARKET DATA CACHE TABLE
-- ============================================
-- Caches market data to reduce API calls and enable history.

CREATE TABLE IF NOT EXISTS market_data_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  data JSONB NOT NULL,                  -- OHLCV candles, indicators
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  
  UNIQUE(symbol, timeframe)
);

CREATE INDEX idx_market_cache_lookup ON market_data_cache(symbol, timeframe);
CREATE INDEX idx_market_cache_expires ON market_data_cache(expires_at);

-- ============================================
-- 7. AUDIT LOG TABLE
-- ============================================
-- Tracks important system events for debugging and compliance.

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,                 -- 'analysis.created', 'trade.opened', etc.
  entity_type TEXT,                     -- 'analysis', 'trade', 'strategy'
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
-- Supabase RLS ensures users can only access their own data.
-- These policies are enforced at the database level.

-- Enable RLS on all tables
ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_data_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies: users can only access their own data
-- (market_data_cache is public — no user_id)

-- Strategies
CREATE POLICY "Users manage own strategies"
  ON strategies FOR ALL
  USING (auth.uid() = user_id);

-- Analyses
CREATE POLICY "Users manage own analyses"
  ON analyses FOR ALL
  USING (auth.uid() = user_id);

-- Trades
CREATE POLICY "Users manage own trades"
  ON trades FOR ALL
  USING (auth.uid() = user_id);

-- Watchlist
CREATE POLICY "Users manage own watchlist"
  ON watchlist FOR ALL
  USING (auth.uid() = user_id);

-- User preferences
CREATE POLICY "Users manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Market data cache (no user restriction — shared cache)
-- Allow all authenticated users to read; only service role can write
CREATE POLICY "Authenticated users can read market cache"
  ON market_data_cache FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE POLICY "Service role manages market cache"
  ON market_data_cache FOR ALL
  USING (auth.role() = 'service_role');

-- Audit logs
CREATE POLICY "Users see own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages audit logs"
  ON audit_logs FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
-- Automatically sets updated_at on any row modification.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER trigger_strategies_updated_at
  BEFORE UPDATE ON strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_analyses_updated_at
  BEFORE UPDATE ON analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DONE
-- ============================================
-- Schema created successfully.
-- Next: Configure Supabase Auth (email/password) in the dashboard.
