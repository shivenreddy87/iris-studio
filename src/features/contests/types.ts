import type { ContestAvailability, EligibilityResult } from "./eligibility";

export const CONTEST_STATUSES = [
  "draft",
  "published",
  "applications_open",
  "applications_closed",
  "participant_selection",
  "live",
  "completed",
  "archived",
] as const;

export type ContestStatus = (typeof CONTEST_STATUSES)[number];

export const CONTEST_STATUS_LABELS: Record<ContestStatus, string> = {
  draft: "Draft",
  published: "Published",
  applications_open: "Applications Open",
  applications_closed: "Applications Closed",
  participant_selection: "Participant Selection",
  live: "Live",
  completed: "Completed",
  archived: "Archived",
};

/** The only transitions the platform allows, enforced server-side. */
export const CONTEST_TRANSITIONS: Record<ContestStatus, ContestStatus[]> = {
  draft: ["published"],
  published: ["applications_open", "archived"],
  applications_open: ["applications_closed", "archived"],
  applications_closed: ["participant_selection", "archived"],
  participant_selection: ["live", "archived"],
  live: ["completed", "archived"],
  completed: ["archived"],
  archived: [],
};

/** Inherited campaign fields freeze once the contest leaves Draft. */
export function isDraft(status: ContestStatus) {
  return status === "draft";
}

export function canDeleteContest(status: ContestStatus) {
  return status === "draft";
}

export const CONTEST_EVENT_TYPES = [
  "created",
  "updated",
  "published",
  "applications_open",
  "applications_closed",
  "participant_selection",
  "live",
  "completed",
  "archived",
  "participant_selection_started",
  "participant_selected",
  "contest_activated",
] as const;

export type ContestEventType = (typeof CONTEST_EVENT_TYPES)[number];

export const CONTEST_EVENT_LABELS: Record<ContestEventType, string> = {
  created: "Contest created",
  updated: "Contest updated",
  published: "Contest published",
  applications_open: "Applications opened",
  applications_closed: "Applications closed",
  participant_selection: "Participant selection started",
  live: "Contest started",
  completed: "Contest completed",
  archived: "Contest archived",
  participant_selection_started: "Participant selection started",
  participant_selected: "Participant selected",
  contest_activated: "Contest activated",
};

/** Event written when a contest enters a given status. */
export const STATUS_EVENT: Record<ContestStatus, ContestEventType> = {
  draft: "created",
  published: "published",
  applications_open: "applications_open",
  applications_closed: "applications_closed",
  participant_selection: "participant_selection_started",
  live: "contest_activated",
  completed: "completed",
  archived: "archived",
};

export type Contest = {
  id: string;
  campaignRequestId: string;
  approvalReference: string | null;
  businessId: string;
  businessName: string | null;
  title: string;
  description: string | null;
  campaignGoal: string | null;
  businessCategory: string | null;
  targetPlatform: string | null;
  targetLocation: string | null;
  requiredViews: number | null;
  rewardPool: number | null;
  participantLimit: number | null;
  winnerCount: number | null;
  preferredCreatorCategory: string | null;
  minimumFollowers: number | null;
  maximumFollowers: number | null;
  applicationStartDate: string | null;
  applicationDeadline: string | null;
  contestStartDate: string | null;
  contestEndDate: string | null;
  contestBrief: string | null;
  contestRules: string | null;
  attachmentUrl: string | null;
  status: ContestStatus;
  publishedAt: string | null;
  archivedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ContestEvent = {
  id: string;
  contestId: string;
  actorId: string | null;
  actorName: string | null;
  eventType: ContestEventType;
  note: string | null;
  createdAt: string;
};

/** An approved campaign request that has no contest yet. */
export type ContestSource = {
  id: string;
  title: string;
  businessId: string;
  businessName: string | null;
  approvalReference: string | null;
  businessCategory: string | null;
  targetPlatform: string | null;
  requiredViews: number | null;
  budget: number | null;
  approvedAt: string | null;
};

export type ContestWinner = {
  id: string;
  contestId: string;
  contestTitle: string;
  influencerId: string;
  influencerName: string | null;
  position: number;
  rewardAmount: number | null;
  currency: string;
  announcedAt: string | null;
  createdAt: string;
};

/* ---------- Discovery ---------- */

export const CONTEST_SORTS = [
  { key: "newest", label: "Newest" },
  { key: "highest_reward", label: "Highest Reward" },
  { key: "earliest_deadline", label: "Earliest Deadline" },
  { key: "contest_start", label: "Contest Start" },
] as const;

export type ContestSortKey = (typeof CONTEST_SORTS)[number]["key"];

/** Statuses an influencer can filter discovery by. */
export const DISCOVERABLE_STATUSES = ["published", "applications_open"] as const;
export type DiscoverableStatus = (typeof DISCOVERABLE_STATUSES)[number];

export type ContestDiscoveryFilters = {
  search?: string;
  platform?: string;
  creatorCategory?: string;
  location?: string;
  status?: DiscoverableStatus | "all";
  minReward?: number | null;
  maxReward?: number | null;
  minFollowers?: number | null;
  maxFollowers?: number | null;
  /** Only contests whose application deadline falls on or before this date. */
  deadlineBefore?: string | null;
  sort?: ContestSortKey;
  page?: number;
  pageSize?: number;
};

/** One discovery row: contest + server-evaluated eligibility + saved state. */
export type DiscoveryContest = {
  contest: Contest;
  eligibility: EligibilityResult;
  availability: ContestAvailability;
  saved: boolean;
};

export type DiscoveryPage = {
  items: DiscoveryContest[];
  total: number;
  page: number;
  pageSize: number;
};

export type ContestDetailForInfluencer = DiscoveryContest & {
  events: ContestEvent[];
};
