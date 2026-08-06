import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEFAULT_PREFERENCES } from "./types";
import type { NotificationItem, NotificationListResult, NotificationPreferences } from "./types";
import { mapNotification, mapPreferences } from "./mappers";

const filtersSchema = z.object({
  status: z.enum(["all", "unread", "read", "archived"]).default("all"),
  category: z.enum(["all", "campaign", "contest", "payout", "system", "marketing"]).default("all"),
  search: z.string().trim().max(200).optional(),
  since: z.string().optional().nullable(),
  cursor: z.string().optional().nullable(),
  limit: z.number().int().min(1).max(50).default(20),
});

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => filtersSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<NotificationListResult> => {
    const sb = context.supabase;

    let query = sb
      .from("notifications")
      .select("*")
      .eq("user_id", context.userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(data.limit + 1);

    if (data.status === "unread") query = query.is("read_at", null).is("archived_at", null);
    else if (data.status === "read")
      query = query.not("read_at", "is", null).is("archived_at", null);
    else if (data.status === "archived") query = query.not("archived_at", "is", null);
    else query = query.is("archived_at", null);

    if (data.category !== "all") query = query.eq("metadata->>category", data.category);
    if (data.since) query = query.gte("created_at", data.since);
    if (data.cursor) query = query.lt("created_at", data.cursor);
    if (data.search) {
      const term = `%${data.search.replace(/[%_]/g, "")}%`;
      query = query.or(`title.ilike.${term},body.ilike.${term}`);
    }

    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);

    const list = (rows ?? []) as Parameters<typeof mapNotification>[0][];
    const hasMore = list.length > data.limit;
    const page = hasMore ? list.slice(0, data.limit) : list;
    const items: NotificationItem[] = page.map(mapNotification);

    const { count } = await sb
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", context.userId)
      .is("read_at", null)
      .is("archived_at", null)
      .is("deleted_at", null);

    return {
      items,
      nextCursor: hasMore ? (page[page.length - 1]?.created_at ?? null) : null,
      unreadCount: count ?? 0,
    };
  });

const idSchema = z.object({ id: z.string().uuid() });

export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markNotificationUnread = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId)
      .is("read_at", null);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const archiveNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertNotSuspended(context.userId);
    const now = new Date().toISOString();
    const { error } = await context.supabase
      .from("notifications")
      .update({ archived_at: now, read_at: now })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const unarchiveNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("notifications")
      .update({ archived_at: null })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => idSchema.parse(d))
  .handler(async ({ context, data }) => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("notifications")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<NotificationPreferences> => {
    const { data, error } = await context.supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return { userId: context.userId, ...DEFAULT_PREFERENCES };
    return mapPreferences(data);
  });

const prefsSchema = z.object({
  emailEnabled: z.boolean(),
  inAppEnabled: z.boolean(),
  campaignUpdates: z.boolean(),
  contestUpdates: z.boolean(),
  payoutUpdates: z.boolean(),
  marketing: z.boolean(),
  system: z.boolean(),
});

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => prefsSchema.parse(d))
  .handler(async ({ context, data }): Promise<NotificationPreferences> => {
    await assertNotSuspended(context.userId);
    const { data: row, error } = await context.supabase
      .from("notification_preferences")
      .upsert(
        {
          user_id: context.userId,
          email_enabled: data.emailEnabled,
          in_app_enabled: data.inAppEnabled,
          campaign_updates: data.campaignUpdates,
          contest_updates: data.contestUpdates,
          payout_updates: data.payoutUpdates,
          marketing: data.marketing,
          system: data.system,
        },
        { onConflict: "user_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return mapPreferences(row);
  });
