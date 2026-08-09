/**
 * useAnalysis Hook
 * 
 * React Query hooks for AI analysis operations.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/lib/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AnalysisResult {
  analysis: {
    id: string;
    symbol: string;
    timeframe: string;
    market_type: string;
    ai_provider: string;
    ai_model: string;
    analysis_type: string;
    reasoning: string;
    confidence_score: number | null;
    direction: string | null;
    entry_price: number | null;
    stop_loss: number | null;
    take_profit_1: number | null;
    take_profit_2: number | null;
    take_profit_3: number | null;
    strategy_id: string | null;
    created_at: string;
  };
  ai: {
    provider: string;
    model: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    structured: {
      direction: string;
      confidence: number;
      entry_price: number | null;
      stop_loss: number | null;
      take_profit_1: number | null;
      take_profit_2: number | null;
      take_profit_3: number | null;
      key_levels: Array<{ type: string; price: number; description: string }>;
      reasoning_summary: string;
    };
  };
}

export interface AnalysisListItem {
  id: string;
  symbol: string;
  timeframe: string;
  market_type: string;
  ai_provider: string;
  ai_model: string;
  analysis_type: string;
  reasoning: string;
  confidence_score: number | null;
  direction: string | null;
  entry_price: number | null;
  stop_loss: number | null;
  take_profit_1: number | null;
  created_at: string;
}

export interface AIProviderInfo {
  id: string;
  name: string;
  available: boolean;
  models: string[];
  supportsVision: boolean;
}

export interface CreateAnalysisInput {
  symbol: string;
  timeframe: string;
  provider?: string;
  analysis_type?: string;
  strategy_id?: string;
  chart_image?: string;
  market_type?: string;
}

// ──────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────

const ANALYSIS_KEY = ['analysis'];

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

/**
 * List analyses with pagination.
 */
export function useAnalyses(options: { page?: number; limit?: number; symbol?: string } = {}) {
  return useQuery({
    queryKey: [ANALYSIS_KEY, 'list', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));
      if (options.symbol) params.set('symbol', options.symbol);

      const response = await apiGet<AnalysisListItem[]>(`/analysis?${params}`);
      return response.data;
    },
  });
}

/**
 * Get a single analysis by ID.
 */
export function useAnalysis(id: string | null) {
  return useQuery({
    queryKey: [ANALYSIS_KEY, id],
    queryFn: async () => {
      const response = await apiGet<AnalysisListItem>(`/analysis/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Run a new AI analysis.
 */
export function useCreateAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateAnalysisInput) => {
      const response = await apiPost<AnalysisResult>('/analysis', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYSIS_KEY });
    },
  });
}

/**
 * Delete an analysis.
 */
export function useDeleteAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/analysis/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANALYSIS_KEY });
    },
  });
}

/**
 * Get available AI providers.
 */
export function useAIProviders() {
  return useQuery({
    queryKey: [ANALYSIS_KEY, 'providers'],
    queryFn: async () => {
      const response = await apiGet<AIProviderInfo[]>('/analysis/providers');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
