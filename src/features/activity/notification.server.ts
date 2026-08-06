import { mapNotification, mapPreferences } from "./mappers";
export { mapNotification, mapPreferences };
import {
  DEFAULT_PREFERENCES,
  type ActivityInput,
  type Meta,
  type NotificationCategory,
  type NotificationInput,
  type NotificationItem,
  type NotificationPreferences,
  type NotificationPriority,
} from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type PrefRow = {
  user_id: string;
  in_app_enabled: boolean;
  campaign_updates: boolean;
  contest_updates: boolean;
  payout_updates: boolean;
  marketing: boolean;
  system: boolean;
};

function allows(pref: PrefRow | undefined, category: NotificationCategory): boolean {
  if (!pref) return category !== "marketing" || DEFAULT_PREFERENCES.marketing;
  if (!pref.in_app_enabled) return false;
  switch (category) {
    case "campaign":
      return pref.campaign_updates;
    case "contest":
      return pref.contest_updates;
    case "payout":
      return pref.payout_updates;
    case "marketing":
      return pref.marketing;
    case "system":
    default:
      return pref.system;
  }
}

/**
 * Shared writer for in-app notifications. Every feature module must go through
 * this instead of inserting into `notifications` directly, so preferences,
 * action links and priority stay consistent across the platform.
 */
export async function createNotification(input: NotificationInput): Promise<void> {
  await createNotifications([input]);
}

export async function createNotifications(inputs: NotificationInput[]): Promise<void> {
  const list = inputs.filter((n) => Boolean(n.userId));
  if (list.length === 0) return;

  const sb = await admin();
  const userIds = [...new Set(list.map((n) => n.userId))];
  const { data: prefs } = await sb
    .from("notification_preferences")
    .select(
      "user_id, in_app_enabled, campaign_updates, contest_updates, payout_updates, marketing, system",
    )
    .in("user_id", userIds);

  const prefMap = new Map<string, PrefRow>();
  for (const row of (prefs ?? []) as PrefRow[]) prefMap.set(row.user_id, row);

  const rows = list
    .filter((n) => allows(prefMap.get(n.userId), n.category))
    .map((n) => ({
      user_id: n.userId,
      kind: n.kind ?? ("system" as const),
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
      action_url: n.link ?? null,
      action_label: n.actionLabel ?? null,
      priority: n.priority ?? "normal",
      metadata: { ...(n.metadata ?? {}), category: n.category } as never,
    }));

  if (rows.length === 0) return;
  const { error } = await sb.from("notifications").insert(rows);
  if (error) throw new Error(error.message);
}

/** Convenience: notify every admin with the same payload. */
export async function notifyAdmins(input: Omit<NotificationInput, "userId">): Promise<void> {
  const sb = await admin();
  const { data } = await sb.from("user_roles").select("user_id").eq("role", "admin");
  const ids = (data ?? []).map((r) => r.user_id as string);
  await createNotifications(ids.map((userId) => ({ ...input, userId })));
}

/* ------------------------------------------------------------------ */
/* Activity                                                            */
/* ------------------------------------------------------------------ */

export async function createActivity(input: ActivityInput): Promise<void> {
  const sb = await admin();
  const { error } = await sb.from("activity_feed").insert({
    actor_id: input.actorId ?? null,
    target_user_id: input.targetUserId ?? null,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
    metadata: (input.metadata ?? {}) as never,
  });
  if (error) throw new Error(error.message);
}

/** Records an activity and notifies people in one call. */
export async function recordEvent(input: {
  activity: ActivityInput;
  notifications?: NotificationInput[];
}): Promise<void> {
  await createActivity(input.activity);
  if (input.notifications?.length) await createNotifications(input.notifications);
}

/* ------------------------------------------------------------------ */
/* Mapping helpers                                                     */
/* ------------------------------------------------------------------ */
