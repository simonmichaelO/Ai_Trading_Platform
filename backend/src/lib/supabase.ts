/**
 * Supabase Database Client
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import config from '@config/index';
import { logger } from '@utils/logger';

let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_supabaseAdmin) return _supabaseAdmin;

  if (!config.supabase.url || !config.supabase.serviceRoleKey) {
    throw new Error(
      ' Supabase database client not configured.\n' +
      '   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env'
    );
  }

  // Import ws for WebSocket support on Node.js 20
  const ws = require('ws');

  _supabaseAdmin = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      db: {
        schema: 'public',
      },
      // Use ws transport for Node.js < 22
      realtime: {
        params: {
          transport: ws,
        },
      },
      global: {
        headers: {
          'x-client-info': 'ai-trading-platform/1.0.0',
        },
      },
    }
  );

  logger.info('Supabase database client initialized', {
    url: config.supabase.url.replace(/\/\/.*\.supabase\.co/, '//***.supabase.co'),
  });

  return _supabaseAdmin;
}

export const supabaseAdmin = {
  get client(): SupabaseClient {
    return getSupabaseAdmin();
  },
};

export async function checkDatabaseHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const client = getSupabaseAdmin();
    const { error } = await client.from('user_preferences').select('id').limit(1);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { ok: false, error: message };
  }
}
