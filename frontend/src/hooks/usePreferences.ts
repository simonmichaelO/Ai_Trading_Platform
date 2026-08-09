/**
 * usePreferences Hook
 * 
 * React Query hook for user preferences.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/lib/api';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'dark' | 'light';
  default_timeframe: string;
  default_market_type: string;
  preferred_ai_provider: string;
  preferred_ai_model: string;
  notifications: Record<string, boolean>;
  default_risk_percent: number;
  default_rr_ratio: number;
  created_at: string;
  updated_at: string;
}

export interface UpdatePreferencesInput {
  theme?: 'dark' | 'light';
  default_timeframe?: string;
  default_market_type?: string;
  preferred_ai_provider?: string;
  preferred_ai_model?: string;
  default_risk_percent?: number;
  default_rr_ratio?: number;
}

// ──────────────────────────────────────────────
// Query keys
// ──────────────────────────────────────────────

const PREFERENCES_KEY = ['preferences'];

// ──────────────────────────────────────────────
// Hooks
// ──────────────────────────────────────────────

/**
 * Fetch user preferences.
 */
export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: async () => {
      const response = await apiGet<UserPreferences>('/preferences');
      return response.data;
    },
  });
}

/**
 * Update user preferences.
 */
export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdatePreferencesInput) => {
      const response = await apiPut<UserPreferences>('/preferences', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PREFERENCES_KEY });
    },
  });
}
