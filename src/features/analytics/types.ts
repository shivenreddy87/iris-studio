/**
 * Shared analytics contracts.
 *
 * Every number rendered by an analytics surface comes from one of these
 * shapes, produced by `analytics.server.ts` and exposed through
 * `analytics.functions.ts`. Components never aggregate on their own.
 */

export type SeriesPoint = {
  label: string;
  value: number;
};

export type MultiSeriesPoint = {
  label: string;
  [key: string]: string | number;
};

export type FunnelStep = {
  label: string;
  value: number;
};

export type DateRangeKey = "7d" | "30d" | "90d" | "all";

export const DATE_RANGES: { key: DateRangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
  { key: "all", label: "All time", days: null },
];

export function rangeDays(key: DateRangeKey | undefined): number | null {
  return DATE_RANGES.find((r) => r.key === key)?.days ?? null;
}

/* ------------------------------- Platform ------------------------------- */

export type PlatformAnalytics = {
  users: { total: number; businesses: number; influencers: number; suspended: number };
  requests: { total: number; pending: number; approved: number; rejected: number };
  contests: {
    total: number;
    live: number;
    completed: number;
    draft: number;
    applicationsOpen: number;
  };
  engagement: {
    applications: number;
    participants: number;
    submissions: number;
    verified: number;
    avgEngagement: number;
  };
  rewards: { awarded: number; paid: number; pending: number; failed: number };
  growth: {
    businesses: SeriesPoint[];
    influencers: SeriesPoint[];
    contests: SeriesPoint[];
    applications: SeriesPoint[];
  };
  moderation: { openFlags: number; activeSuspensions: number; recentActions: number };
  health: {
    stuckRequests: number;
    contestsWithoutParticipants: number;
    unverifiedSubmissions: number;
    stalePayouts: number;
  };
};

/* ------------------------------- Business ------------------------------- */

export type BusinessAnalytics = {
  requestsCreated: number;
  requestsApproved: number;
  approvedRate: number;
  contestsCreated: number;
  contestsCompleted: number;
  contestSuccessRate: number;
  applicationsReceived: number;
  participantsSelected: number;
  submissionsReceived: number;
  submissionProgress: number;
  verifiedContent: number;
  completionRate: number;
  rewardDistributed: number;
  avgEngagement: number;
  avgCompletionDays: number;
  applicationsOverTime: SeriesPoint[];
  contestBreakdown: SeriesPoint[];
};

/* ------------------------------ Influencer ------------------------------ */

export type AchievementCode =
  | "first_application"
  | "first_selection"
  | "first_win"
  | "top_performer"
  | "fast_responder"
  | "consistent_creator";

export type Achievement = {
  code: string;
  title: string;
  description: string;
  icon: string | null;
  earned: boolean;
  earnedAt: string | null;
};

export type InfluencerAnalytics = {
  applicationsSubmitted: number;
  accepted: number;
  acceptanceRate: number;
  selected: number;
  selectionRate: number;
  wins: number;
  winRate: number;
  avgSubmissionHours: number;
  rewardsWon: number;
  rewardsPaid: number;
  activeContests: number;
  completedContests: number;
  avgEngagement: number;
  scoreTrend: SeriesPoint[];
  applicationsOverTime: SeriesPoint[];
  achievements: Achievement[];
};

/* -------------------------------- Contest ------------------------------- */

export type ContestAnalytics = {
  contestId: string;
  title: string;
  status: string;
  applicationsOverTime: SeriesPoint[];
  participantFunnel: FunnelStep[];
  submissionFunnel: FunnelStep[];
  verificationFunnel: FunnelStep[];
  winnerBreakdown: { label: string; rank: number; score: number; reward: number }[];
  rewardDistribution: SeriesPoint[];
  timeline: { label: string; date: string | null }[];
  totals: {
    applications: number;
    participants: number;
    submissions: number;
    verified: number;
    winners: number;
    rewardAwarded: number;
    rewardPaid: number;
    avgEngagement: number;
  };
};

/* ------------------------------ Sub domains ----------------------------- */

export type CampaignAnalytics = {
  byStatus: SeriesPoint[];
  overTime: SeriesPoint[];
  approvalRate: number;
  avgReviewHours: number;
  total: number;
};

export type SubmissionAnalytics = {
  byStatus: SeriesPoint[];
  overTime: SeriesPoint[];
  avgEngagement: number;
  totalViews: number;
  total: number;
};

export type WinnerAnalytics = {
  byRank: SeriesPoint[];
  topInfluencers: { id: string; name: string; wins: number; reward: number }[];
  totalReward: number;
  total: number;
};

export type PayoutAnalytics = {
  byStatus: SeriesPoint[];
  overTime: SeriesPoint[];
  totalPaid: number;
  totalPending: number;
  totalFailed: number;
  total: number;
};

export type DashboardAnalytics = {
  role: "admin" | "business" | "influencer";
  platform?: PlatformAnalytics;
  business?: BusinessAnalytics;
  influencer?: InfluencerAnalytics;
};
