/**
 * useTrades Hook — React Query hooks for trading journal.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export interface Trade {
  id: string;
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  status: 'open' | 'closed' | 'cancelled';
  exit_price: number | null;
  pnl: number | null;
  pnl_percent: number | null;
  outcome: 'win' | 'loss' | 'breakeven' | null;
  risk_reward_ratio: number | null;
  notes: string | null;
  tags: string[];
  emotional_state: string | null;
  opened_at: string;
  closed_at: string | null;
}

export interface TradeStats {
  totalTrades: number;
  openTrades: number;
  winRate: number;
  totalPnl: number;
}

export interface CreateTradeInput {
  symbol: string;
  direction: 'long' | 'short';
  entry_price: number;
  stop_loss?: number;
  take_profit?: number;
  strategy_id?: string;
  analysis_id?: string;
  risk_reward_ratio?: number;
  notes?: string;
  tags?: string[];
}

const TRADES_KEY = ['trades'];

export function useTrades(options: { page?: number; limit?: number; status?: string } = {}) {
  return useQuery({
    queryKey: [TRADES_KEY, 'list', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.set('page', String(options.page));
      if (options.limit) params.set('limit', String(options.limit));
      if (options.status) params.set('status', options.status);
      const response = await apiGet<Trade[]>(`/trades?${params}`);
      return response.data;
    },
  });
}

export function useTradeStats() {
  return useQuery({
    queryKey: [TRADES_KEY, 'stats'],
    queryFn: async () => {
      const response = await apiGet<TradeStats>('/trades/stats');
      return response.data;
    },
  });
}

export function useCreateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTradeInput) => {
      const response = await apiPost<Trade>('/trades', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADES_KEY });
    },
  });
}

export function useUpdateTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Record<string, unknown>) => {
      const response = await apiPut<Trade>(`/trades/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADES_KEY });
    },
  });
}

export function useDeleteTrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/trades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRADES_KEY });
    },
  });
}
