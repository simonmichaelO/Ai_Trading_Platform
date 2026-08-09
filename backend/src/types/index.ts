/**
 * Core Type Definitions
 * 
 * TypeScript interfaces that define the shape of data across the entire platform.
 * These mirror the database schema and are used by services, controllers, and repositories.
 * 
 * Naming convention:
 *   - I{Name} — Interface for database records
 *   - {Name}Create — Data needed to create a new record
 *   - {Name}Update — Data that can be updated (all fields optional)
 *   - {Name}Response — What the API returns to the frontend
 */

// ──────────────────────────────────────────────
// ENUMS & CONSTANTS
// ──────────────────────────────────────────────

export type MarketType = 'forex' | 'crypto' | 'stocks' | 'indices' | 'commodities';
export type Direction = 'long' | 'short' | 'neutral';
export type TradeStatus = 'open' | 'closed' | 'cancelled';
export type TradeOutcome = 'win' | 'loss' | 'breakeven';
export type AIProvider = 'openai' | 'anthropic' | 'gemini';
export type AnalysisType = 'data' | 'vision' | 'hybrid';
export type EmotionalState = 'confident' | 'neutral' | 'fearful' | 'greedy' | 'anxious' | 'frustrated';

// ──────────────────────────────────────────────
// STRATEGY
// ──────────────────────────────────────────────

export interface IStrategy {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  entry_rules: string[];
  exit_rules: string[];
  risk_rules: string[];
  indicators: string[];
  prompt_template: string | null;
  is_enabled: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface StrategyCreate {
  name: string;
  description?: string;
  entry_rules?: string[];
  exit_rules?: string[];
  risk_rules?: string[];
  indicators?: string[];
  prompt_template?: string;
  is_enabled?: boolean;
}

export interface StrategyUpdate {
  name?: string;
  description?: string;
  entry_rules?: string[];
  exit_rules?: string[];
  risk_rules?: string[];
  indicators?: string[];
  prompt_template?: string;
  is_enabled?: boolean;
  is_default?: boolean;
}

// ──────────────────────────────────────────────
// ANALYSIS
// ──────────────────────────────────────────────

export interface IAnalysis {
  id: string;
  user_id: string;
  symbol: string;
  timeframe: string;
  market_type: MarketType;
  market_snapshot: MarketSnapshot;
  ai_provider: AIProvider;
  ai_model: string;
  analysis_type: AnalysisType;
  reasoning: string;
  confidence_score: number | null;
  chart_annotations: ChartAnnotations | null;
  annotated_chart_url: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  take_profit_2: number | null;
  take_profit_3: number | null;
  direction: Direction | null;
  strategy_id: string | null;
  chart_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisCreate {
  symbol: string;
  timeframe: string;
  market_type: MarketType;
  market_snapshot: MarketSnapshot;
  ai_provider: AIProvider;
  ai_model: string;
  analysis_type: AnalysisType;
  reasoning: string;
  confidence_score?: number;
  chart_annotations?: ChartAnnotations;
  annotated_chart_url?: string;
  entry_price?: number;
  stop_loss?: number;
  take_profit_1?: number;
  take_profit_2?: number;
  take_profit_3?: number;
  direction?: Direction;
  strategy_id?: string;
  chart_image_url?: string;
}

// ──────────────────────────────────────────────
// TRADE (Trading Journal)
// ──────────────────────────────────────────────

export interface ITrade {
  id: string;
  user_id: string;
  analysis_id: string | null;
  strategy_id: string | null;
  symbol: string;
  direction: Direction;
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: TradeStatus;
  exit_price: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  outcome: TradeOutcome | null;
  risk_reward_ratio: number | null;
  position_size: number | null;
  notes: string | null;
  tags: string[];
  emotional_state: EmotionalState | null;
  lessons_learned: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TradeCreate {
  analysis_id?: string;
  strategy_id?: string;
  symbol: string;
  direction: Direction;
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  risk_reward_ratio?: number;
  position_size?: number;
  notes?: string;
  tags?: string[];
  emotional_state?: EmotionalState;
}

export interface TradeUpdate {
  status?: TradeStatus;
  exit_price?: number;
  pnl?: number;
  pnl_percent?: number;
  outcome?: TradeOutcome;
  notes?: string;
  tags?: string[];
  lessons_learned?: string;
  closed_at?: string;
}

// ──────────────────────────────────────────────
// MARKET DATA
// ──────────────────────────────────────────────

export interface MarketSnapshot {
  symbol: string;
  timeframe: string;
  price: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  candles?: Candle[];
  indicators?: Record<string, number | number[]>;
  volume?: number;
  timestamp: string;
}

export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ──────────────────────────────────────────────
// CHART ANNOTATIONS (from Vision AI)
// ──────────────────────────────────────────────

export interface ChartAnnotations {
  trend_lines?: TrendLine[];
  support_levels?: PriceLevel[];
  resistance_levels?: PriceLevel[];
  order_blocks?: Zone[];
  fair_value_gaps?: Zone[];
  liquidity_zones?: Zone[];
  break_of_structure?: BreakOfStructure[];
  change_of_character?: ChangeOfCharacter[];
  supply_zones?: Zone[];
  demand_zones?: Zone[];
  entry?: TradeLevel;
  stop_loss?: TradeLevel;
  take_profit?: TradeLevel[];
  key_levels?: Array<{
    type: string;
    price: number;
    description: string;
  }>;
}

export interface PriceLevel {
  price: number;
  strength: 'strong' | 'moderate' | 'weak';
  label?: string;
}

export interface TrendLine {
  start: { price: number; time: string };
  end: { price: number; time: string };
  type: 'support' | 'resistance';
}

export interface Zone {
  high: number;
  low: number;
  type: string;
  label?: string;
}

export interface TradeLevel {
  price: number;
  confidence: number;
  reasoning?: string;
}

export interface BreakOfStructure {
  price: number;
  direction: 'bullish' | 'bearish';
  time: string;
}

export interface ChangeOfCharacter {
  price: number;
  direction: 'bullish' | 'bearish';
  time: string;
}

// ──────────────────────────────────────────────
// USER PREFERENCES
// ──────────────────────────────────────────────

export interface IUserPreferences {
  id: string;
  user_id: string;
  theme: 'dark' | 'light';
  default_timeframe: string;
  default_market_type: MarketType;
  preferred_ai_provider: AIProvider;
  preferred_ai_model: string;
  notifications: Record<string, boolean>;
  default_risk_percent: number;
  default_rr_ratio: number;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesUpdate {
  theme?: 'dark' | 'light';
  default_timeframe?: string;
  default_market_type?: MarketType;
  preferred_ai_provider?: AIProvider;
  preferred_ai_model?: string;
  notifications?: Record<string, boolean>;
  default_risk_percent?: number;
  default_rr_ratio?: number;
}

// ──────────────────────────────────────────────
// API RESPONSE TYPES
// ──────────────────────────────────────────────

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Standard API error response */
export interface ApiError {
  success: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Paginated response */
export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
