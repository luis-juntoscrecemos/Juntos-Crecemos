import { supabase } from './supabase';

export async function logAuditEvent(
  actorUserId: string | null,
  actorEmail: string | null,
  action: string,
  entityType: string | null = null,
  entityId: string | null = null,
  metadata: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase.from('internal_audit_logs').insert({
      actor_user_id: actorUserId,
      actor_email: actorEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
    });
  } catch (error) {
    console.error('[Audit] Failed to log event:', error);
  }
}
