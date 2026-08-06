export type ContestStatus =
  | "draft"
  | "open"
  | "selecting"
  | "active"
  | "judging"
  | "completed"
  | "cancelled";

export const CONTEST_STATUS_LABELS: Record<ContestStatus, string> = {
  draft: "Draft",
  open: "Open for entries",
  selecting: "Selecting participants",
  active: "Running",
  judging: "Judging",
  completed: "Completed",
  cancelled: "Cancelled",
};

export type Contest = {
  id: string;
  campaignRequestId: string | null;
  businessId: string | null;
  businessName: string | null;
  title: string;
  description: string | null;
  rules: string | null;
  rewardDescription: string | null;
  rewardAmount: number | null;
  currency: string;
  maxParticipants: number | null;
  entryDeadline: string | null;
  startsAt: string | null;
  endsAt: string | null;
  status: ContestStatus;
  createdAt: string;
  updatedAt: string;
};

export type ContestInput = {
  campaignRequestId?: string;
  title: string;
  description?: string;
  rules?: string;
  rewardDescription?: string;
  rewardAmount?: number;
  currency?: string;
  maxParticipants?: number;
  entryDeadline?: string;
  startsAt?: string;
  endsAt?: string;
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
