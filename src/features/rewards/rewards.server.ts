/**
 * Reward-tier persistence. Every payable amount is derived here or in the pure
 * calculation module — never from client input.
 */

import { calculateReward, findRewardTier, validateRewardTiers } from "./reward-calculation";
import { DEFAULT_CURRENCY, type RewardTier, type RewardTierInput } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type Row = {
  id: string;
  contest_id: string;
  minimum_views: number | string;
  maximum_views: number | string | null;
  reward_amount: number | string;
  currency: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: Row): RewardTier {
  return {
    id: row.id,
    contestId: row.contest_id,
    minimumViews: Number(row.minimum_views),
    maximumViews: row.maximum_views === null ? null : Number(row.maximum_views),
    rewardAmount: Number(row.reward_amount),
    currency: row.currency ?? DEFAULT_CURRENCY,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchRewardTiers(contestId: string): Promise<RewardTier[]> {
  const db = await admin();
  const { data, error } = await db
    .from("contest_reward_tiers")
    .select("id, contest_id, minimum_views, maximum_views, reward_amount, currency, created_at, updated_at")
    .eq("contest_id", contestId)
    .order("minimum_views", { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Row[]).map(mapRow);
}

export async function fetchRewardTiersFor(contestIds: string[]): Promise<Map<string, RewardTier[]>> {
  const map = new Map<string, RewardTier[]>();
  if (contestIds.length === 0) return map;
  const db = await admin();
  const { data, error } = await db
    .from("contest_reward_tiers")
    .select("id, contest_id, minimum_views, maximum_views, reward_amount, currency, created_at, updated_at")
    .in("contest_id", contestIds)
    .order("minimum_views", { ascending: true });
  if (error) throw new Error(error.message);
  for (const row of (data ?? []) as Row[]) {
    const tier = mapRow(row);
    const list = map.get(tier.contestId) ?? [];
    list.push(tier);
    map.set(tier.contestId, list);
  }
  return map;
}

/** Replaces the whole ladder atomically-ish; validated before any write. */
export async function replaceRewardTiers(
  contestId: string,
  tiers: RewardTierInput[],
  currency = DEFAULT_CURRENCY,
): Promise<RewardTier[]> {
  const validation = validateRewardTiers(tiers);
  if (!validation.ok) throw new Error(validation.errors.join(" "));

  const db = await admin();
  const { error: deleteError } = await db
    .from("contest_reward_tiers")
    .delete()
    .eq("contest_id", contestId);
  if (deleteError) throw new Error(deleteError.message);

  const { error } = await db.from("contest_reward_tiers").insert(
    tiers.map((tier) => ({
      contest_id: contestId,
      minimum_views: tier.minimumViews,
      maximum_views: tier.maximumViews,
      reward_amount: tier.rewardAmount,
      currency,
    })) as never,
  );
  if (error) throw new Error(error.message);
  return fetchRewardTiers(contestId);
}

/** Server-authoritative amount for a verified view count. */
export async function calculateRewardForContest(
  contestId: string,
  views: number | null,
): Promise<{ amount: number; tier: RewardTier | null; tiers: RewardTier[] }> {
  const tiers = await fetchRewardTiers(contestId);
  if (views === null || tiers.length === 0) return { amount: 0, tier: null, tiers };
  return { amount: calculateReward(views, tiers), tier: findRewardTier(views, tiers), tiers };
}
