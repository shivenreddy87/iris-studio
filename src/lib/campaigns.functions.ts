import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCampaigns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getCampaign = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: campaign, error } = await context.supabase
      .from("campaigns")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!campaign) return null;
    const { data: deals } = await context.supabase
      .from("deals")
      .select("*")
      .eq("campaign_id", data.id);
    const creatorIds = Array.from(new Set((deals ?? []).map((d) => d.creator_user_id)));
    const { data: creators } = creatorIds.length
      ? await context.supabase
          .from("creator_profiles")
          .select("user_id, display_name, handle, niche, accent, followers, avg_rate, match_score, bio")
          .in("user_id", creatorIds)
      : { data: [] };
    const map = new Map((creators ?? []).map((c) => [c.user_id, c]));
    const dealsWithCreator = (deals ?? []).map((d) => ({ ...d, creator: map.get(d.creator_user_id) ?? null }));
    return { campaign, deals: dealsWithCreator };
  });

const CreateCampaignInput = z.object({
  name: z.string().min(1).max(200),
  brief: z.string().max(4000).default(""),
  budget: z.number().int().min(0).default(0),
  currency: z.string().max(6).default("USD"),
  goal: z.string().max(200).optional(),
  starts_at: z.string().optional(),
  ends_at: z.string().optional(),
  creator_user_ids: z.array(z.string().uuid()).default([]),
});

export const createCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateCampaignInput.parse(d))
  .handler(async ({ context, data }) => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (!org) throw new Error("No organization found. Please refresh.");

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        org_id: org.id,
        name: data.name,
        brief: data.brief,
        budget: data.budget,
        currency: data.currency,
        goal: data.goal ?? null,
        starts_at: data.starts_at || null,
        ends_at: data.ends_at || null,
        status: "live",
        created_by: userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Create deals + conversations for each shortlisted creator
    for (const creatorId of data.creator_user_ids) {
      const { data: deal } = await supabase
        .from("deals")
        .insert({
          campaign_id: campaign.id,
          creator_user_id: creatorId,
          stage: "invited",
          offer: 0,
        })
        .select("id")
        .single();
      const { data: convo } = await supabase
        .from("conversations")
        .insert({
          campaign_id: campaign.id,
          deal_id: deal?.id,
          brand_user_id: userId,
          creator_user_id: creatorId,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (convo) {
        await supabase.from("messages").insert({
          conversation_id: convo.id,
          sender_id: userId,
          sender_role: "brand",
          body: `You've been invited to "${campaign.name}". Take a look at the brief and let me know your thoughts.`,
        });
      }
      // Notify creator
      const { createNotification } = await import("@/features/activity/notification.server");
      await createNotification({
        userId: creatorId,
        kind: "invitation",
        category: "campaign",
        title: `New campaign invitation`,
        body: `You've been invited to "${campaign.name}"`,
        link: `/app/creator/opportunities`,
        actionLabel: "View invitation",
      });
    }

    return campaign;
  });

export const updateCampaign = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        brief: z.string().optional(),
        status: z.enum(["draft", "live", "review", "completed", "archived"]).optional(),
        budget: z.number().int().min(0).optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertNotSuspended(context.userId);
    const { id, ...updates } = data;
    const { data: updated, error } = await context.supabase
      .from("campaigns")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });
