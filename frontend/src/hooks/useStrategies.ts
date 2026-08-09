/**
 * useStrategies Hook
 * 
 * React Query hooks for strategy data fetching and mutations.
 * 
 * Usage:
 *   const { data: strategies, isLoading } = useStrategies();
 *   const { mutate: createStrategy } = useCreateStrategy();
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete, ApiResponse } from '@/lib/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface Strategy {
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

export interface CreateStrategyInput {
  name: string;
  description?: string;
  entry_rules?: string[];
  exit_rules?: string[];
  risk_rules?: string[];
  indicators?: string[];
  prompt_template?: string;
  is_enabled?: boolean;
}

export interface UpdateStrategyInput {
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
// Query keys
// ──────────────────────────────────────────────

const STRATEGIES_KEY = ['strategies'];

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

/**
 * Fetch all strategies for the current user.
 */
export function useStrategies(enabledOnly = false) {
  return useQuery({
    queryKey: enabledOnly ? [...STRATEGIES_KEY, 'enabled'] : STRATEGIES_KEY,
    queryFn: async () => {
      const response = await apiGet<Strategy[]>(
        `/strategies${enabledOnly ? '?enabledOnly=true' : ''}`
      );
      return response.data;
    },
  });
}

/**
 * Fetch a single strategy by ID.
 */
export function useStrategy(id: string | null) {
  return useQuery({
    queryKey: [...STRATEGIES_KEY, id],
    queryFn: async () => {
      const response = await apiGet<Strategy>(`/strategies/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

/**
 * Create a new strategy.
 */
export function useCreateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateStrategyInput) => {
      const response = await apiPost<Strategy>('/strategies', input);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate strategies list to refetch
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
}

/**
 * Update an existing strategy.
 */
export function useUpdateStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateStrategyInput & { id: string }) => {
      const response = await apiPut<Strategy>(`/strategies/${id}`, input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
}

/**
 * Delete a strategy.
 */
export function useDeleteStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiDelete(`/strategies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRATEGIES_KEY });
    },
  });
}
