import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PLATFORMS = ["instagram", "tiktok", "youtube", "twitter", "facebook", "snapchat"] as const;
export type Platform = (typeof PLATFORMS)[number];

const upsertSchema = z.object({
  platform: z.enum(PLATFORMS),
  handle: z.string().trim().min(1).max(64),
  profile_url: z.string().trim().url().max(500).optional().nullable(),
  followers: z.number().int().min(0).max(1_000_000_000).optional().nullable(),
  engagement_rate: z.number().min(0).max(100).optional().nullable(),
  avatar_url: z.string().trim().url().max(500).optional().nullable(),
});

export const listConnectedAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId?: string } | undefined) => d ?? {})
  .handler(async ({ data, context }) => {
    const target = data.userId ?? context.userId;
    const { data: rows, error } = await context.supabase
      .from("connected_accounts")
      .select("*")
      .eq("user_id", target)
      .order("platform");
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const upsertConnectedAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => upsertSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    const { data: row, error } = await context.supabase
      .from("connected_accounts")
      .upsert(
        {
          user_id: context.userId,
          platform: data.platform,
          handle: data.handle,
          profile_url: data.profile_url ?? null,
          followers: data.followers ?? null,
          engagement_rate: data.engagement_rate ?? null,
          avatar_url: data.avatar_url ?? null,
          status: "connected",
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,platform" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const disconnectAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { platform: z.infer<typeof upsertSchema>["platform"] }) => d)
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("connected_accounts")
      .delete()
      .eq("user_id", context.userId)
      .eq("platform", data.platform);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
