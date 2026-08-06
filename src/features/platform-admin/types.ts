export type ModerationTargetType =
  | "business"
  | "influencer"
  | "contest"
  | "campaign_request"
  | "submission";

export type ModerationAction = "flag" | "unflag" | "suspend" | "reactivate" | "note";

export type ModerationRecord = {
  id: string;
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationAction;
  reason: string | null;
  note: string | null;
  actorId: string | null;
  actorName: string | null;
  createdAt: string;
};

export type Suspension = {
  id: string;
  userId: string;
  role: string | null;
  reason: string;
  suspendedAt: string;
  suspendedBy: string | null;
  liftedAt: string | null;
};

export type AdminUserRow = {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
  role: "business" | "influencer" | "admin";
  createdAt: string;
  suspended: boolean;
  suspensionReason: string | null;
  /** Role-specific rollups from the statistics views. */
  stats: Record<string, number>;
};

export type PlatformCategory = {
  id: string;
  kind: "business" | "creator";
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

export type PlatformChannel = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
};

export type ContestTemplate = {
  id: string;
  name: string;
  description: string | null;
  contestBrief: string | null;
  contestRules: string | null;
  eligibility: {
    minimumFollowers?: number | null;
    maximumFollowers?: number | null;
    location?: string | null;
  };
  rewardPool: number | null;
  participantLimit: number | null;
  winnerCount: number | null;
  targetPlatform: string | null;
  preferredCreatorCategory: string | null;
  isActive: boolean;
  createdAt: string;
};

export type PlatformSettingsValues = {
  default_participant_limit: number;
  default_winner_count: number;
  minimum_reward: number;
  maximum_reward: number;
  application_duration_days: number;
  contest_duration_days: number;
  payout_reminder_days: number;
  notification_defaults: {
    email_enabled: boolean;
    in_app_enabled: boolean;
    campaign_updates: boolean;
    contest_updates: boolean;
    payout_updates: boolean;
    marketing: boolean;
    system: boolean;
  };
};

export type PlatformSettings = {
  id: string;
  version: number;
  settings: PlatformSettingsValues;
  note: string | null;
  createdAt: string;
};

export type ReportKind =
  | "contest"
  | "campaign_request"
  | "winner"
  | "payout"
  | "user"
  | "business"
  | "influencer"
  | "activity"
  | "contest_summary"
  | "campaign_performance"
  | "reward_distribution"
  | "contest_history"
  | "reward_history"
  | "performance_summary";

export type ReportPayload = {
  kind: ReportKind;
  title: string;
  generatedAt: string;
  rows: Record<string, unknown>[];
};

export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = {
  flag: "Flagged",
  unflag: "Flag cleared",
  suspend: "Suspended",
  reactivate: "Reactivated",
  note: "Note added",
};

export const MODERATION_TARGET_LABELS: Record<ModerationTargetType, string> = {
  business: "Business",
  influencer: "Influencer",
  contest: "Contest",
  campaign_request: "Campaign request",
  submission: "Submission",
};
