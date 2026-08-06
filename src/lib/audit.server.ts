/**
 * Immutable audit trail.
 *
 * Server-only. Every admin mutation and every high-value user action records an
 * entry here. Failures are swallowed: auditing must never break a business
 * mutation, but the failure is logged server-side.
 */

export type AuditEntry = {
  actorId: string | null;
  actorRole?: string | null;
  entityType: string;
  entityId?: string | null;
  action: string;
  previousValues?: unknown;
  newValues?: unknown;
  /** Placeholders until an edge proxy forwards the real client metadata. */
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function recordAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("audit_logs").insert({
      actor_id: entry.actorId,
      actor_role: entry.actorRole ?? null,
      entity_type: entry.entityType,
      entity_id: entry.entityId ?? null,
      action: entry.action,
      previous_values: (entry.previousValues ?? null) as never,
      new_values: (entry.newValues ?? null) as never,
      ip_address: entry.ipAddress ?? null,
      user_agent: entry.userAgent ?? null,
    });
    if (error) console.error("[audit] insert failed", error.message);
  } catch (cause) {
    console.error("[audit] insert threw", cause);
  }
}

/** Convenience wrapper for admin-originated mutations. */
export function recordAdminAudit(
  actorId: string,
  entityType: string,
  action: string,
  detail: { entityId?: string | null; previousValues?: unknown; newValues?: unknown } = {},
): Promise<void> {
  return recordAuditLog({ actorId, actorRole: "admin", entityType, action, ...detail });
}
