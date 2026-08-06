/**
 * Pure scoring engine for contest winner evaluation.
 *
 * Every weight and normalisation bound is an exported constant so the scoring
 * model can be tuned — or replaced by an AI judge implementing the same
 * signatures — without touching call sites.
 */

export type SubmissionMetrics = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  /** Optional admin quality score, 0-10. */
  reviewScore?: number | null;
};

/** Weights must sum to 1. */
export const SCORE_WEIGHTS = {
  reach: 0.4,
  engagement: 0.4,
  review: 0.2,
} as const;

/** Engagement rate above this is treated as a perfect engagement component. */
export const ENGAGEMENT_RATE_CEILING = 15;

/** Admin review score scale. */
export const REVIEW_SCORE_MAX = 10;

/** Fallback reach target when a contest sets no required views. */
export const DEFAULT_REACH_TARGET = 10_000;

/** Scores are reported on a 0-100 scale with this precision. */
export const SCORE_PRECISION = 2;

function round(value: number, precision = SCORE_PRECISION): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1 ? 1 : value;
}

/**
 * Engagement rate as a percentage of views.
 * Returns 0 when there are no views, so unscored submissions never rank ahead.
 */
export function calculateEngagementRate(metrics: SubmissionMetrics): number {
  const { views, likes, comments, shares } = metrics;
  if (!Number.isFinite(views) || views <= 0) return 0;
  const interactions = (likes || 0) + (comments || 0) + (shares || 0);
  return round((interactions / views) * 100);
}

/**
 * Weighted 0-100 performance score combining reach against the contest target,
 * engagement rate and the admin review score.
 */
export function calculatePerformanceScore(
  metrics: SubmissionMetrics,
  options: { requiredViews?: number | null } = {},
): number {
  const target =
    options.requiredViews && options.requiredViews > 0
      ? options.requiredViews
      : DEFAULT_REACH_TARGET;

  const reach = clamp01((metrics.views || 0) / target);
  const engagement = clamp01(calculateEngagementRate(metrics) / ENGAGEMENT_RATE_CEILING);
  const review = clamp01((metrics.reviewScore ?? 0) / REVIEW_SCORE_MAX);

  const score =
    reach * SCORE_WEIGHTS.reach +
    engagement * SCORE_WEIGHTS.engagement +
    review * SCORE_WEIGHTS.review;

  return round(score * 100);
}

/** The score that decides ranking: a manual override always wins. */
export function resolveFinalScore(performanceScore: number, manualScore?: number | null): number {
  return manualScore === null || manualScore === undefined
    ? round(performanceScore)
    : round(manualScore);
}

export type RankableSubmission = {
  id: string;
  finalScore: number;
  views: number;
  engagementRate: number;
  submittedAt: string;
};

export type RankedSubmission<T extends RankableSubmission> = T & { rank: number };

/**
 * Ranks submissions by final score, then views, then engagement rate, then the
 * earliest submission. Deterministic: equal inputs always produce equal ranks.
 */
export function rankContestSubmissions<T extends RankableSubmission>(
  submissions: T[],
): RankedSubmission<T>[] {
  return [...submissions]
    .sort((a, b) => {
      if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
      if (b.views !== a.views) return b.views - a.views;
      if (b.engagementRate !== a.engagementRate) return b.engagementRate - a.engagementRate;
      return a.submittedAt.localeCompare(b.submittedAt);
    })
    .map((submission, index) => ({ ...submission, rank: index + 1 }));
}

export type ContestStatistics = {
  submissionCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalEngagements: number;
  averageEngagementRate: number;
  averageScore: number;
  topScore: number;
};

/** Aggregate performance across scored submissions. Safe to show to businesses. */
export function calculateContestStatistics(
  submissions: Array<SubmissionMetrics & { finalScore?: number; engagementRate?: number }>,
): ContestStatistics {
  const count = submissions.length;
  if (count === 0) {
    return {
      submissionCount: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalShares: 0,
      totalEngagements: 0,
      averageEngagementRate: 0,
      averageScore: 0,
      topScore: 0,
    };
  }

  let views = 0;
  let likes = 0;
  let comments = 0;
  let shares = 0;
  let engagementSum = 0;
  let scoreSum = 0;
  let topScore = 0;

  for (const item of submissions) {
    views += item.views || 0;
    likes += item.likes || 0;
    comments += item.comments || 0;
    shares += item.shares || 0;
    engagementSum += item.engagementRate ?? calculateEngagementRate(item);
    const score = item.finalScore ?? calculatePerformanceScore(item);
    scoreSum += score;
    if (score > topScore) topScore = score;
  }

  return {
    submissionCount: count,
    totalViews: views,
    totalLikes: likes,
    totalComments: comments,
    totalShares: shares,
    totalEngagements: likes + comments + shares,
    averageEngagementRate: round(engagementSum / count),
    averageScore: round(scoreSum / count),
    topScore: round(topScore),
  };
}

/** Even split of the reward pool across the configured winner count. */
export function defaultRewardAmount(
  rewardPool: number | null,
  winnerCount: number | null,
): number | null {
  if (!rewardPool || !winnerCount || winnerCount <= 0) return null;
  return round(rewardPool / winnerCount);
}
