import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getBrandAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [{ data: campaigns }, { data: deals }] = await Promise.all([
      supabase.from("campaigns").select("id, name, status, reach, engagement_rate, spend, budget, created_at"),
      supabase.from("deals").select("id, stage, offer, creator_user_id, campaign_id, updated_at"),
    ]);

    // Fetch creator names for deals
    const creatorIds = Array.from(new Set((deals ?? []).map((d) => d.creator_user_id)));
    const { data: creators } = creatorIds.length
      ? await supabase.from("creator_profiles").select("user_id, display_name").in("user_id", creatorIds)
      : { data: [] as { user_id: string; display_name: string | null }[] };
    const creatorMap = new Map((creators ?? []).map((c) => [c.user_id, c.display_name ?? "Creator"]));

    const active = (campaigns ?? []).filter((c) => c.status === "live").length;
    const totalReach = (campaigns ?? []).reduce((s, c) => s + (c.reach ?? 0), 0);
    const totalSpend = (deals ?? [])
      .filter((d) => d.stage === "agreed" || d.stage === "in_production" || d.stage === "delivered")
      .reduce((s, d) => s + (d.offer ?? 0), 0);
    const engagements = Math.round(
      (campaigns ?? []).reduce((s, c) => s + ((c.reach ?? 0) * (c.engagement_rate ?? 0)) / 100, 0),
    );

    const byCreator = new Map<string, { name: string; total: number; count: number }>();
    for (const d of deals ?? []) {
      const key = d.creator_user_id;
      const entry = byCreator.get(key) ?? { name: creatorMap.get(key) ?? "Creator", total: 0, count: 0 };
      entry.total += d.offer ?? 0;
      entry.count += 1;
      byCreator.set(key, entry);
    }
    const topCreators = Array.from(byCreator.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Weekly series (last 12 weeks) — synthesize from campaign created_at + reach
    const now = Date.now();
    const weeks = Array.from({ length: 12 }).map((_, i) => {
      const weekStart = now - (11 - i) * 7 * 24 * 60 * 60 * 1000;
      const label = new Date(weekStart).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      const weekReach = (campaigns ?? [])
        .filter((c) => new Date(c.created_at).getTime() <= weekStart)
        .reduce((s, c) => s + Math.round((c.reach ?? 0) / 12), 0);
      const weekEng = Math.round(weekReach * 0.05);
      return { label, reach: weekReach, engagement: weekEng };
    });

    return {
      totals: { activeCampaigns: active, totalReach, totalSpend, engagements },
      topCreators,
      weeks,
    };
  });
