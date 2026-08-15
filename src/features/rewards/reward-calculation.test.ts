import { describe, expect, it } from "vitest";
import {
  calculateReward,
  describeProgress,
  findRewardTier,
  validateRewardTiers,
} from "./reward-calculation";
import type { RewardTier } from "./types";

function tier(min: number, max: number | null, amount: number, id = `${min}`): RewardTier {
  return {
    id,
    contestId: "c1",
    minimumViews: min,
    maximumViews: max,
    rewardAmount: amount,
    currency: "INR",
  };
}

const LADDER: RewardTier[] = [
  tier(0, 50_000, 500),
  tier(50_001, 100_000, 1_000),
  tier(100_001, 250_000, 1_500),
  tier(250_001, null, 2_500),
];

describe("findRewardTier / calculateReward", () => {
  it("picks the tier containing the view count", () => {
    expect(findRewardTier(120_000, LADDER)?.rewardAmount).toBe(1_500);
    expect(calculateReward(120_000, LADDER)).toBe(1_500);
  });

  it("handles boundaries inclusively", () => {
    expect(calculateReward(50_000, LADDER)).toBe(500);
    expect(calculateReward(50_001, LADDER)).toBe(1_000);
    expect(calculateReward(100_000, LADDER)).toBe(1_000);
  });

  it("uses the open-ended top tier for very high views", () => {
    expect(calculateReward(9_000_000, LADDER)).toBe(2_500);
  });

  it("returns zero when no tier is reached", () => {
    expect(calculateReward(10, [tier(1_000, 5_000, 100)])).toBe(0);
    expect(calculateReward(-5, LADDER)).toBe(0);
  });
});

describe("describeProgress", () => {
  it("reports the next tier and the gap", () => {
    const progress = describeProgress(82_450, LADDER);
    expect(progress.currentReward).toBe(1_000);
    expect(progress.nextTier?.rewardAmount).toBe(1_500);
    expect(progress.viewsToNextTier).toBe(17_551);
  });

  it("marks unverified metrics as pending", () => {
    const progress = describeProgress(null, LADDER);
    expect(progress.pending).toBe(true);
    expect(progress.currentReward).toBeNull();
  });
});

describe("validateRewardTiers", () => {
  it("accepts a well-formed ladder", () => {
    expect(validateRewardTiers(LADDER).ok).toBe(true);
  });

  it("rejects an empty ladder", () => {
    expect(validateRewardTiers([]).ok).toBe(false);
  });

  it("rejects overlapping ranges", () => {
    const result = validateRewardTiers([tier(0, 60_000, 500), tier(50_000, 100_000, 1_000)]);
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate ranges", () => {
    const result = validateRewardTiers([tier(0, 50_000, 500, "a"), tier(0, 50_000, 900, "b")]);
    expect(result.ok).toBe(false);
  });

  it("rejects an inverted range and negative amounts", () => {
    expect(validateRewardTiers([tier(100, 50, 500)]).ok).toBe(false);
    expect(validateRewardTiers([tier(0, 50, -1)]).ok).toBe(false);
  });

  it("allows only one open-ended tier, and only at the top", () => {
    expect(validateRewardTiers([tier(0, null, 500), tier(10, null, 900)]).ok).toBe(false);
  });
});
