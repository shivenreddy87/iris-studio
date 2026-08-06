import type { Contest } from "@/features/contests/types";
import type { ContestAvailability, EligibilityResult } from "@/features/contests/eligibility";

export const APPLICATION_STATUSES = [
  "submitted",
  "withdrawn",
  "shortlisted",
  "selected",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  withdrawn: "Withdrawn",
  shortlisted: "Shortlisted",
  selected: "Selected",
  rejected: "Rejected",
};

/** Statuses an application can hold while it is still in play. */
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "shortlisted",
  "selected",
  "rejected",
  "withdrawn",
];

/** Statuses admins filter by inside the participant selection workspace. */
export const SELECTION_FILTER_STATUSES: ApplicationStatus[] = [
  "submitted",
  "shortlisted",
  "selected",
  "rejected",
];

export const APPLICATION_EVENT_TYPES = [
  "submitted",
  "withdrawn",
  "status_changed",
  "shortlisted",
  "selected",
  "rejected",
] as const;

export type ApplicationEventType = (typeof APPLICATION_EVENT_TYPES)[number];

export const APPLICATION_EVENT_LABELS: Record<ApplicationEventType, string> = {
  submitted: "Application submitted",
  withdrawn: "Application withdrawn",
  status_changed: "Status changed",
  shortlisted: "Application shortlisted",
  selected: "Selected as participant",
  rejected: "Application rejected",
};

/** The only application status transitions participant selection may perform. */
export const SELECTION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  submitted: ["shortlisted", "selected", "rejected"],
  shortlisted: ["selected", "rejected"],
  selected: [],
  rejected: [],
  withdrawn: [],
};

export function canTransitionApplication(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return SELECTION_TRANSITIONS[from].includes(to);
}

export const PARTICIPATION_STATUSES = ["active", "removed", "completed"] as const;

export type ParticipationStatus = (typeof PARTICIPATION_STATUSES)[number];

export const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  active: "Active",
  removed: "Removed",
  completed: "Completed",
};

export type ContestParticipant = {
  id: string;
  contestId: string;
  applicationId: string;
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  followers: number | null;
  niche: string | null;
  portfolioUrl: string | null;
  selectedAt: string;
  activatedAt: string | null;
  participationStatus: ParticipationStatus;
  createdAt: string;
};

/** Everything the admin selection workspace header needs. */
export type SelectionSummaryData = {
  contestId: string;
  contestStatus: string;
  participantLimit: number | null;
  totalApplications: number;
  selectedCount: number;
  shortlistedCount: number;
  rejectedCount: number;
  remainingSlots: number | null;
  canSelect: boolean;
  canActivate: boolean;
  activatedAt: string | null;
};


export type ContestApplication = {
  id: string;
  contestId: string;
  contestTitle: string;
  businessCategory: string | null;
  applicationDeadline: string | null;
  contestStatus: Contest["status"];
  influencerId: string;
  influencerName: string | null;
  influencerHandle: string | null;
  portfolioUrl: string;
  contentIdea: string;
  notes: string | null;
  status: ApplicationStatus;
  submittedAt: string;
  withdrawnAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ApplicationEvent = {
  id: string;
  applicationId: string;
  actorId: string | null;
  actorName: string | null;
  eventType: ApplicationEventType;
  note: string | null;
  createdAt: string;
};

/** Aggregate counts a business may see — never applicant identities. */
export type ApplicationSummaryCounts = {
  total: number;
  byStatus: Record<ApplicationStatus, number>;
};

export const APPLICATION_ERROR_CODES = [
  "contest_not_found",
  "contest_archived",
  "applications_not_open",
  "outside_application_window",
  "not_eligible",
  "already_applied",
  "application_not_found",
  "withdraw_window_closed",
  "already_withdrawn",
  "forbidden",
] as const;

export type ApplicationErrorCode = (typeof APPLICATION_ERROR_CODES)[number];

export const APPLICATION_ERROR_MESSAGES: Record<ApplicationErrorCode, string> = {
  contest_not_found: "This contest no longer exists.",
  contest_archived: "This contest has been archived.",
  applications_not_open: "This contest is not accepting applications right now.",
  outside_application_window: "The application window for this contest is not open.",
  not_eligible: "Your profile does not meet this contest's requirements.",
  already_applied: "You have already applied to this contest.",
  application_not_found: "Application not found.",
  withdraw_window_closed: "Applications can only be withdrawn while the contest is open.",
  already_withdrawn: "This application has already been withdrawn.",
  forbidden: "You do not have access to this application.",
};

/** Typed failure the UI can render without parsing message strings. */
export type ApplicationValidation =
  | { ok: true }
  | { ok: false; code: ApplicationErrorCode; message: string };

export function applicationFailure(code: ApplicationErrorCode): ApplicationValidation {
  return { ok: false, code, message: APPLICATION_ERROR_MESSAGES[code] };
}

/** Everything the contest detail page needs to render the apply flow. */
export type ApplicationContext = {
  canApply: boolean;
  reason: ApplicationErrorCode | null;
  reasonMessage: string | null;
  application: ContestApplication | null;
  eligibility: EligibilityResult;
  availability: ContestAvailability;
};

export function canWithdraw(
  application: ContestApplication,
  contestStatus: Contest["status"],
): boolean {
  return application.status === "submitted" && contestStatus === "applications_open";
}
