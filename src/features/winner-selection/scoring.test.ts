import { describe, expect, it } from "vitest";
import {
  calculateContestStatistics,
  calculateEngagementRate,
  calculatePerformanceScore,
  defaultRewardAmount,
  rankContestSubmissions,
  resolveFinalScore,
  SCORE_WEIGHTS,
} from "@/features/winner-selection/scoring";

describe("scoring weights", () => {
  it("sum to 1", () => {
    const total = SCORE_WEIGHTS.reach + SCORE_WEIGHTS.engagement + SCORE_WEIGHTS.review;
    expect(total).toBeCloseTo(1, 10);
  });
});

describe("calculateEngagementRate", () => {
  it("returns 0 without views", () => {
    expect(calculateEngagementRate({ views: 0, likes: 10, comments: 2, shares: 1 })).toBe(0);
  });

  it("expresses interactions as a percentage of views", () => {
    expect(calculateEngagementRate({ views: 1000, likes: 80, comments: 15, shares: 5 })).toBe(10);
  });
});

describe("calculatePerformanceScore", () => {
  it("is 0 for an empty submission", () => {
    expect(calculatePerformanceScore({ views: 0, likes: 0, comments: 0, shares: 0 })).toBe(0);
  });

  it("caps every component so the score never exceeds 100", () => {
    const score = calculatePerformanceScore(
      { views: 10_000_000, likes: 9_000_000, comments: 500_000, shares: 500_000, reviewScore: 10 },
      { requiredViews: 1000 },
    );
    expect(score).toBe(100);
  });

  it("uses the contest reach target when provided", () => {
    const low = calculatePerformanceScore({ views: 5000, likes: 0, comments: 0, shares: 0 });
    const high = calculatePerformanceScore(
      { views: 5000, likes: 0, comments: 0, shares: 0 },
      { requiredViews: 5000 },
    );
    expect(high).toBeGreaterThan(low);
    expect(high).toBe(40);
  });
});

describe("resolveFinalScore", () => {
  it("prefers a manual override", () => {
    expect(resolveFinalScore(52.5, 90)).toBe(90);
    expect(resolveFinalScore(52.5, null)).toBe(52.5);
    expect(resolveFinalScore(52.5)).toBe(52.5);
  });

  it("honours a manual zero", () => {
    expect(resolveFinalScore(80, 0)).toBe(0);
  });
});

describe("rankContestSubmissions", () => {
  const base = { views: 100, engagementRate: 1, submittedAt: "2026-01-01T00:00:00.000Z" };

  it("ranks by score first", () => {
    const ranked = rankContestSubmissions([
      { id: "a", finalScore: 40, ...base },
      { id: "b", finalScore: 90, ...base },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["b", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("breaks ties on views, then engagement, then earliest submission", () => {
    const ranked = rankContestSubmissions([
      { id: "late", finalScore: 50, views: 100, engagementRate: 2, submittedAt: "2026-02-02" },
      { id: "early", finalScore: 50, views: 100, engagementRate: 2, submittedAt: "2026-01-01" },
      { id: "views", finalScore: 50, views: 500, engagementRate: 1, submittedAt: "2026-03-03" },
    ]);
    expect(ranked.map((r) => r.id)).toEqual(["views", "early", "late"]);
  });

  it("does not mutate its input", () => {
    const input = [
      { id: "a", finalScore: 10, ...base },
      { id: "b", finalScore: 20, ...base },
    ];
    rankContestSubmissions(input);
    expect(input.map((r) => r.id)).toEqual(["a", "b"]);
  });
});

describe("calculateContestStatistics", () => {
  it("returns zeroes for no submissions", () => {
    expect(calculateContestStatistics([]).submissionCount).toBe(0);
  });

  it("aggregates totals and averages", () => {
    const stats = calculateContestStatistics([
      { views: 1000, likes: 100, comments: 0, shares: 0, finalScore: 80 },
      { views: 3000, likes: 200, comments: 100, shares: 0, finalScore: 40 },
    ]);
    expect(stats.submissionCount).toBe(2);
    expect(stats.totalViews).toBe(4000);
    expect(stats.totalEngagements).toBe(400);
    expect(stats.averageScore).toBe(60);
    expect(stats.topScore).toBe(80);
  });
});

describe("defaultRewardAmount", () => {
  it("splits the pool evenly", () => {
    expect(defaultRewardAmount(1000, 4)).toBe(250);
  });

  it("returns null for incomplete configuration", () => {
    expect(defaultRewardAmount(null, 4)).toBeNull();
    expect(defaultRewardAmount(1000, 0)).toBeNull();
  });
});
