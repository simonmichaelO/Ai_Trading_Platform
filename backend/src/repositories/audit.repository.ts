/**
 * Audit Log Repository
 * 
 * Records important system events for debugging, compliance, and analytics.
 */

import { getSupabaseAdmin } from '@lib/supabase';
import { logger } from '@utils/logger';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface AuditLogEntry {
  user_id?: string;
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

// ──────────────────────────────────────────────
// Create audit log entry
// ──────────────────────────────────────────────

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    const db = getSupabaseAdmin();

    await db.from('audit_logs').insert({
      user_id: entry.user_id || null,
      action: entry.action,
      entity_type: entry.entity_type || null,
      entity_id: entry.entity_id || null,
      metadata: entry.metadata || null,
      ip_address: entry.ip_address || null,
    });
  } catch (error) {
    // Audit failures should not crash the app
    // Just log the failure and move on
    logger.warn('Failed to write audit log', {
      action: entry.action,
      error: error instanceof Error ? error.message : 'Unknown',
    });
  }
}

// ──────────────────────────────────────────────
// List audit logs (admin use)
// ──────────────────────────────────────────────

export async function listAuditLogs(
  userId: string,
  options: { limit?: number; action?: string } = {}
): Promise<Array<{
  id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}>> {
  const db = getSupabaseAdmin();
  const limit = options.limit || 50;

  let query = db
    .from('audit_logs')
    .select('id, action, entity_type, entity_id, metadata, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (options.action) {
    query = query.eq('action', options.action);
  }

  const { data, error } = await query;

  if (error) {
    logger.error('Failed to list audit logs', { userId, error: error.message });
    return [];
  }

  return data || [];
}
