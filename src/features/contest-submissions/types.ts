import type { Contest } from "@/features/contests/types";

export const SUBMISSION_PLATFORMS = ["instagram", "tiktok", "youtube"] as const;

export type SubmissionPlatform = (typeof SUBMISSION_PLATFORMS)[number];

export const SUBMISSION_PLATFORM_LABELS: Record<SubmissionPlatform, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
};

export const SUBMISSION_STATUSES = ["pending", "submitted", "verified", "flagged"] as const;

export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending: "Pending",
  submitted: "Submitted",
  verified: "Verified",
  flagged: "Flagged",
};

/** Review decisions an admin may record against a submission. */
export const REVIEW_STATUSES = ["verified", "flagged"] as const;

export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const SUBMISSION_EVENT_TYPES = [
  "submission_created",
  "submission_verified",
  "submission_flagged",
] as const;

export type SubmissionEventType = (typeof SUBMISSION_EVENT_TYPES)[number];

export const SUBMISSION_EVENT_LABELS: Record<SubmissionEventType, string> = {
  submission_created: "Content submitted",
  submission_verified: "Submission verified",
  submission_flagged: "Submission flagged",
};

export type ContestSubmission = {
  id: string;
  contestId: string;
  contestTitle: string;
  participantId: string;
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  portfolioUrl: string | null;
  platform: string;
  contentUrl: string;
  caption: string | null;
  notes: string | null;
  status: SubmissionStatus;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SubmissionEvent = {
  id: string;
  submissionId: string;
  eventType: SubmissionEventType | string;
  actorId: string | null;
  actorName: string | null;
  note: string | null;
  createdAt: string;
};

/** One row of the admin submissions workspace: a participant with or without a submission. */
export type ParticipantSubmission = {
  participantId: string;
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  portfolioUrl: string | null;
  followers: number | null;
  niche: string | null;
  status: SubmissionStatus;
  submission: ContestSubmission | null;
};

/** Aggregate execution progress. Safe for businesses — no applicant identities. */
export type ContestProgress = {
  contestId: string;
  contestStatus: Contest["status"];
  contestEndDate: string | null;
  hasEnded: boolean;
  totalParticipants: number;
  totalSubmitted: number;
  pendingCount: number;
  verifiedCount: number;
  flaggedCount: number;
  /** Percentage of participants who have submitted, 0-100. */
  submissionRate: number;
  lastSubmissionAt: string | null;
};

/** What an influencer needs to execute one contest they were selected for. */
export type ContestExecution = {
  contest: Contest;
  participantId: string | null;
  submission: ContestSubmission | null;
  submissionStatus: SubmissionStatus;
  hasEnded: boolean;
  canSubmit: boolean;
  /** Why submission is closed, when it is. */
  blockedReason: string | null;
};

export function isContestEnded(contest: Contest, now: Date = new Date()): boolean {
  if (contest.status === "completed" || contest.status === "archived") return true;
  if (!contest.contestEndDate) return false;
  return new Date(`${contest.contestEndDate.slice(0, 10)}T23:59:59`).getTime() < now.getTime();
}
