import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("deals")
      .select("*, campaign:campaigns(id, name, currency, brief), creator:creator_profiles!deals_creator_user_id_fkey(user_id, display_name, handle, accent)")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getDeal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: deal, error } = await context.supabase
      .from("deals")
      .select("*, campaign:campaigns(id, name, currency, brief, org_id), creator:creator_profiles!deals_creator_user_id_fkey(user_id, display_name, handle, niche, accent, avg_rate, followers, engagement_rate)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!deal) return null;
    const { data: events } = await context.supabase
      .from("deal_events")
      .select("*")
      .eq("deal_id", data.id)
      .order("created_at", { ascending: false })
      .limit(50);
    return { deal, events: events ?? [] };
  });

export const createDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        campaign_id: z.string().uuid(),
        creator_user_id: z.string().uuid(),
        offer: z.number().int().min(0).default(0),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: deal, error } = await supabase
      .from("deals")
      .upsert(
        {
          campaign_id: data.campaign_id,
          creator_user_id: data.creator_user_id,
          offer: data.offer,
          stage: "invited",
        },
        { onConflict: "campaign_id,creator_user_id" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Ensure a conversation
    const { data: convo } = await supabase
      .from("conversations")
      .upsert(
        {
          campaign_id: data.campaign_id,
          deal_id: deal.id,
          brand_user_id: userId,
          creator_user_id: data.creator_user_id,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: "campaign_id,brand_user_id,creator_user_id" },
      )
      .select("id")
      .single();

    await supabase.from("deal_events").insert({
      deal_id: deal.id,
      actor_id: userId,
      kind: "invited",
      payload: { offer: data.offer },
    });

    await supabase.from("notifications").insert({
      user_id: data.creator_user_id,
      kind: "invitation",
      title: "New campaign invitation",
      body: "A brand has invited you to collaborate",
      link: "/app/creator/opportunities",
    });

    return { deal, conversation_id: convo?.id };
  });

const StageEnum = z.enum(["invited", "negotiating", "agreed", "in_production", "delivered", "cancelled"]);

export const updateDealStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), stage: StageEnum }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: deal, error } = await context.supabase
      .from("deals")
      .update({ stage: data.stage })
      .eq("id", data.id)
      .select("*, creator_user_id, campaign:campaigns(id, name, org_id, currency)")
      .single();
    if (error) throw new Error(error.message);

    await context.supabase.from("deal_events").insert({
      deal_id: data.id,
      actor_id: context.userId,
      kind: `stage_${data.stage}`,
      payload: {},
    });

    // Notify the other party
    const otherUserId =
      context.userId === deal.creator_user_id
        ? // brand user — need to look up
          null
        : deal.creator_user_id;
    if (otherUserId) {
      await context.supabase.from("notifications").insert({
        user_id: otherUserId,
        kind: "deal_update",
        title: `Deal moved to ${data.stage.replace("_", " ")}`,
        link: `/app/deals/${data.id}`,
      });
    }
    return deal;
  });

export const updateDealOffer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), offer: z.number().int().min(0).optional(), counter: z.number().int().min(0).nullable().optional() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const updates: { offer?: number; counter?: number | null } = {};
    if (typeof data.offer === "number") updates.offer = data.offer;
    if (data.counter !== undefined) updates.counter = data.counter;
    const { data: deal, error } = await context.supabase
      .from("deals")
      .update(updates)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("deal_events").insert({
      deal_id: data.id,
      actor_id: context.userId,
      kind: "offer_updated",
      payload: updates as Record<string, number | null>,
    });
    return deal;
  });
