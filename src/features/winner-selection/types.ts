import type { Contest } from "@/features/contests/types";
import type { ContestStatistics } from "./scoring";

export const RESULT_EVENT_TYPES = [
  "winner_selected",
  "winner_removed",
  "winner_finalized",
  "contest_completed",
] as const;

export type ResultEventType = (typeof RESULT_EVENT_TYPES)[number];

export const RESULT_EVENT_LABELS: Record<ResultEventType, string> = {
  winner_selected: "Winner selected",
  winner_removed: "Winner removed",
  winner_finalized: "Winners finalized",
  contest_completed: "Contest completed",
};

export type ResultEvent = {
  id: string;
  contestId: string;
  eventType: ResultEventType | string;
  actorId: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string;
};

export type SubmissionMetricsInput = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  reviewScore: number | null;
  reviewNotes: string | null;
};

/** A verified submission in the admin evaluation workspace. */
export type EvaluationEntry = {
  submissionId: string;
  participantId: string;
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  portfolioUrl: string | null;
  platform: string;
  contentUrl: string;
  submittedAt: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  reviewScore: number | null;
  reviewNotes: string | null;
  performanceScore: number;
  manualScore: number | null;
  finalScore: number;
  rank: number;
  isWinner: boolean;
  winnerRank: number | null;
  rewardAmount: number | null;
  winnerNotes: string | null;
};

export type ContestWinnerEntry = {
  id: string;
  contestId: string;
  contestTitle: string;
  businessCategory: string | null;
  submissionId: string;
  participantId: string;
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  rank: number;
  performanceScore: number;
  manualScore: number | null;
  finalScore: number;
  rewardAmount: number | null;
  winnerNotes: string | null;
  selectedAt: string;
  completedAt: string | null;
  contentUrl: string | null;
  views: number;
  engagementRate: number;
};

/** Admin evaluation workspace payload. */
export type EvaluationBoard = {
  contest: Contest;
  entries: EvaluationEntry[];
  winnerCount: number;
  winnersSelected: number;
  isLocked: boolean;
  lockReason: string | null;
  defaultReward: number | null;
};

/** Contest outcome shared with admins and the owning business. */
export type ContestResults = {
  contestId: string;
  contestTitle: string;
  contestStatus: Contest["status"];
  completedAt: string | null;
  totalParticipants: number;
  verifiedSubmissions: number;
  winnerCount: number;
  winners: ContestWinnerEntry[];
  statistics: ContestStatistics;
  events: ResultEvent[];
};

/** Influencer-facing outcome for one of their entries. */
export type MyContestOutcome = {
  contestId: string;
  contestTitle: string;
  contestStatus: Contest["status"];
  isWinner: boolean;
  rank: number | null;
  rewardAmount: number | null;
  completedAt: string | null;
};

export function positionLabel(rank: number): string {
  if (rank === 1) return "1st place";
  if (rank === 2) return "2nd place";
  if (rank === 3) return "3rd place";
  return `${rank}th place`;
}

/** Influencer-facing performance metrics for their own submission. */
export type SubmissionMetricsSummary = {
  submissionId: string;
  contestId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  performanceScore: number;
  finalScore: number;
  reviewScore: number | null;
  published: boolean;
};
