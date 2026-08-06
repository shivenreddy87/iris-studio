import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/features/contests/contest.server";
import {
  fetchBusinessAnalytics,
  fetchCampaignAnalytics,
  fetchContestAnalytics,
  fetchInfluencerAnalytics,
  fetchPayoutAnalytics,
  fetchPlatformAnalytics,
  fetchSubmissionAnalytics,
  fetchWinnerAnalytics,
  syncInfluencerAchievements,
} from "./analytics.server";
import { rangeDays, type DateRangeKey } from "./types";
import type {
  BusinessAnalytics,
  CampaignAnalytics,
  ContestAnalytics,
  DashboardAnalytics,
  InfluencerAnalytics,
  PayoutAnalytics,
  PlatformAnalytics,
  SubmissionAnalytics,
  WinnerAnalytics,
} from "./types";

type RangeInput = { range?: DateRangeKey };

function days(input: RangeInput | undefined): number {
  return rangeDays(input?.range) ?? 90;
}

export const getPlatformAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput) => data ?? {})
  .handler(async ({ data, context }): Promise<PlatformAnalytics> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchPlatformAnalytics(days(data));
  });

export const getCampaignAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput) => data ?? {})
  .handler(async ({ data, context }): Promise<CampaignAnalytics> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchCampaignAnalytics(days(data));
  });

export const getSubmissionAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput) => data ?? {})
  .handler(async ({ data, context }): Promise<SubmissionAnalytics> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchSubmissionAnalytics(days(data));
  });

export const getWinnerAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WinnerAnalytics> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchWinnerAnalytics();
  });

export const getPayoutAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput) => data ?? {})
  .handler(async ({ data, context }): Promise<PayoutAnalytics> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchPayoutAnalytics(days(data));
  });

/** Business owners see their own numbers; admins may pass a business id. */
export const getBusinessAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput & { businessId?: string }) => data ?? {})
  .handler(async ({ data, context }): Promise<BusinessAnalytics> => {
    let businessId = context.userId;
    if (data.businessId && data.businessId !== context.userId) {
      await assertAdmin(context.supabase, context.userId);
      businessId = data.businessId;
    }
    return fetchBusinessAnalytics(businessId, days(data));
  });

/** Influencers see their own numbers; admins may pass an influencer id. */
export const getInfluencerAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput & { influencerId?: string }) => data ?? {})
  .handler(async ({ data, context }): Promise<InfluencerAnalytics> => {
    let influencerId = context.userId;
    if (data.influencerId && data.influencerId !== context.userId) {
      await assertAdmin(context.supabase, context.userId);
      influencerId = data.influencerId;
    } else {
      await syncInfluencerAchievements(influencerId);
    }
    return fetchInfluencerAnalytics(influencerId, days(data));
  });

/** Contest analytics: the owning business, or an admin. */
export const getContestAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ContestAnalytics> => {
    const { data: contest, error } = await context.supabase
      .from("contests")
      .select("id, business_id")
      .eq("id", data.contestId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!contest) throw new Error("Contest not found.");
    if (contest.business_id !== context.userId) {
      await assertAdmin(context.supabase, context.userId);
    }
    return fetchContestAnalytics(data.contestId);
  });

/** One entry point the dashboards share, resolved from the caller's role. */
export const getDashboardAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: RangeInput) => data ?? {})
  .handler(async ({ data, context }): Promise<DashboardAnalytics> => {
    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const roleKeys = (roles ?? []).map((r) => r.role);
    const window = days(data);

    if (roleKeys.includes("admin")) {
      return { role: "admin", platform: await fetchPlatformAnalytics(window) };
    }
    if (roleKeys.includes("brand")) {
      return { role: "business", business: await fetchBusinessAnalytics(context.userId, window) };
    }
    await syncInfluencerAchievements(context.userId);
    return {
      role: "influencer",
      influencer: await fetchInfluencerAnalytics(context.userId, window),
    };
  });
