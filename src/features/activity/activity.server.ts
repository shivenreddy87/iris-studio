import { mapNotification } from "./notification.server";
import type { ActivityItem, Meta } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loadActorNames(ids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const sb = await admin();
  const { data } = await sb.from("profiles").select("id, full_name, email").in("id", unique);
  for (const row of data ?? []) {
    map.set(
      row.id as string,
      (row.full_name as string | null) ?? (row.email as string | null) ?? "Someone",
    );
  }
  return map;
}

type ActivityRow = {
  id: string;
  actor_id: string | null;
  target_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  metadata: Meta | null;
  created_at: string;
};

export async function mapActivities(rows: ActivityRow[]): Promise<ActivityItem[]> {
  const names = await loadActorNames(rows.map((r) => r.actor_id ?? "").filter(Boolean));
  return rows.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? null) : null,
    targetUserId: row.target_user_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    summary: row.summary,
    metadata: (row.metadata ?? {}) as Meta,
    createdAt: row.created_at,
  }));
}

/** Platform-wide feed. Admin only — caller must verify the role first. */
export async function listPlatformActivity(limit = 25): Promise<ActivityItem[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("activity_feed")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return mapActivities((data ?? []) as ActivityRow[]);
}

/** Activity that involves one user, either as actor or target. */
export async function listUserActivity(userId: string, limit = 10): Promise<ActivityItem[]> {
  const sb = await admin();
  const { data, error } = await sb
    .from("activity_feed")
    .select("*")
    .or(`actor_id.eq.${userId},target_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return mapActivities((data ?? []) as ActivityRow[]);
}

export { mapNotification };
