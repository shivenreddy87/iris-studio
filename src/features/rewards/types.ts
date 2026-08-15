export type RewardTier = {
  id: string;
  contestId: string;
  minimumViews: number;
  /** null on the final, open-ended tier. */
  maximumViews: number | null;
  rewardAmount: number;
  currency: string;
  createdAt?: string;
  updatedAt?: string;
};

/** A tier as edited in the contest wizard, before it has an id. */
export type RewardTierInput = {
  id?: string;
  minimumViews: number;
  maximumViews: number | null;
  rewardAmount: number;
};

export type RewardTierValidation = { ok: true } | { ok: false; errors: string[] };

/** What an influencer sees about their standing against the tier ladder. */
export type RewardProgress = {
  views: number | null;
  currentTier: RewardTier | null;
  currentReward: number | null;
  nextTier: RewardTier | null;
  viewsToNextTier: number | null;
  currency: string;
  /** True when views are not verified yet, so nothing is guaranteed. */
  pending: boolean;
};

export const DEFAULT_CURRENCY = "INR";
