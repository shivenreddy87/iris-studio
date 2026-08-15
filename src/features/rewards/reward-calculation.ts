/**
 * Pure reward-tier maths. No database access, no I/O — the same functions run
 * on the client for previews and on the server for the authoritative amount.
 */

import { DEFAULT_CURRENCY, type RewardProgress, type RewardTier, type RewardTierInput } from "./types";

const OPEN_ENDED = Number.POSITIVE_INFINITY;

function upper(tier: { maximumViews: number | null }): number {
  return tier.maximumViews === null ? OPEN_ENDED : tier.maximumViews;
}

export function sortTiers<T extends { minimumViews: number }>(tiers: T[]): T[] {
  return [...tiers].sort((a, b) => a.minimumViews - b.minimumViews);
}

/**
 * The tier whose range contains `views`. Views below every tier return null —
 * that is "no reward reached yet", not an error.
 */
export function findRewardTier(views: number, tiers: RewardTier[]): RewardTier | null {
  if (!Number.isFinite(views) || views < 0) return null;
  const sorted = sortTiers(tiers);
  let match: RewardTier | null = null;
  for (const tier of sorted) {
    if (views >= tier.minimumViews && views <= upper(tier)) match = tier;
  }
  return match;
}

/** Amount payable at the given verified view count. 0 when no tier is reached. */
export function calculateReward(views: number, tiers: RewardTier[]): number {
  return findRewardTier(views, tiers)?.rewardAmount ?? 0;
}

/** The next tier above the current view count, if the ladder continues. */
export function findNextTier(views: number, tiers: RewardTier[]): RewardTier | null {
  const sorted = sortTiers(tiers);
  return sorted.find((tier) => tier.minimumViews > views) ?? null;
}

export function describeProgress(
  views: number | null,
  tiers: RewardTier[],
  options: { pending?: boolean } = {},
): RewardProgress {
  const currency = tiers[0]?.currency ?? DEFAULT_CURRENCY;
  if (views === null) {
    return {
      views: null,
      currentTier: null,
      currentReward: null,
      nextTier: sortTiers(tiers)[0] ?? null,
      viewsToNextTier: null,
      currency,
      pending: true,
    };
  }
  const currentTier = findRewardTier(views, tiers);
  const nextTier = findNextTier(views, tiers);
  return {
    views,
    currentTier,
    currentReward: currentTier?.rewardAmount ?? 0,
    nextTier,
    viewsToNextTier: nextTier ? Math.max(nextTier.minimumViews - views, 0) : null,
    currency,
    pending: options.pending ?? false,
  };
}

/**
 * Structural rules for a contest's tier ladder: non-negative, ordered, no
 * duplicates, no overlaps, at most one open-ended tier and it must be last.
 */
export function validateRewardTiers(tiers: RewardTierInput[]): { ok: true } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (tiers.length === 0) return { ok: false, errors: ["Add at least one reward tier."] };

  for (const [index, tier] of tiers.entries()) {
    const label = `Tier ${index + 1}`;
    if (!Number.isFinite(tier.minimumViews) || tier.minimumViews < 0) {
      errors.push(`${label}: minimum views must be zero or more.`);
    }
    if (!Number.isFinite(tier.rewardAmount) || tier.rewardAmount < 0) {
      errors.push(`${label}: reward amount must be zero or more.`);
    }
    if (tier.maximumViews !== null) {
      if (!Number.isFinite(tier.maximumViews) || tier.maximumViews < 0) {
        errors.push(`${label}: maximum views must be zero or more.`);
      } else if (tier.maximumViews < tier.minimumViews) {
        errors.push(`${label}: maximum views must be greater than minimum views.`);
      }
    }
  }

  const openEnded = tiers.filter((t) => t.maximumViews === null);
  if (openEnded.length > 1) errors.push("Only the final tier may be open-ended.");

  const sorted = sortTiers(tiers);
  if (openEnded.length === 1 && sorted[sorted.length - 1]?.maximumViews !== null) {
    errors.push("The open-ended tier must be the highest tier.");
  }

  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i]!;
    const next = sorted[i + 1]!;
    if (current.minimumViews === next.minimumViews) {
      errors.push(`Duplicate tier starting at ${next.minimumViews.toLocaleString()} views.`);
      continue;
    }
    if (upper(current) >= next.minimumViews) {
      errors.push(
        `Tiers overlap between ${current.minimumViews.toLocaleString()} and ${next.minimumViews.toLocaleString()} views.`,
      );
    }
  }

  return errors.length === 0 ? { ok: true } : { ok: false, errors: [...new Set(errors)] };
}

export function formatTierRange(tier: { minimumViews: number; maximumViews: number | null }): string {
  const min = tier.minimumViews.toLocaleString();
  return tier.maximumViews === null
    ? `${min}+ views`
    : `${min} – ${tier.maximumViews.toLocaleString()} views`;
}
