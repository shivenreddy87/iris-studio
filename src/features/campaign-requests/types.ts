import { z } from "zod";
import { BUSINESS_CATEGORIES, INFLUENCER_CATEGORIES, PRIMARY_PLATFORMS } from "../profiles/types";

export const CAMPAIGN_REQUEST_STATUSES = [
  "draft",
  "submitted",
  "under_review",
  "changes_requested",
  "approved",
  "rejected",
  "cancelled",
] as const;

export type CampaignRequestStatus = (typeof CAMPAIGN_REQUEST_STATUSES)[number];

export const CAMPAIGN_REQUEST_STATUS_LABELS: Record<CampaignRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  changes_requested: "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

/** Statuses the business can still edit. Drafts can additionally be deleted. */
export function isEditableStatus(status: CampaignRequestStatus) {
  return status === "draft" || status === "changes_requested";
}

export function isDeletableStatus(status: CampaignRequestStatus) {
  return status === "draft";
}

/** Transitions an admin may perform from a given status. */
export const ADMIN_TRANSITIONS: Record<CampaignRequestStatus, CampaignRequestStatus[]> = {
  draft: [],
  submitted: ["under_review"],
  under_review: ["approved", "rejected", "changes_requested"],
  changes_requested: [],
  approved: [],
  rejected: [],
  cancelled: [],
};

export const REQUEST_EVENT_KINDS = [
  "draft_created",
  "submitted",
  "under_review",
  "changes_requested",
  "resubmitted",
  "approved",
  "rejected",
  "note",
] as const;

export type RequestEventKind = (typeof REQUEST_EVENT_KINDS)[number];

export const REQUEST_EVENT_LABELS: Record<RequestEventKind, string> = {
  draft_created: "Draft created",
  submitted: "Submitted",
  under_review: "Under review",
  changes_requested: "Changes requested",
  resubmitted: "Resubmitted",
  approved: "Approved",
  rejected: "Rejected",
  note: "Internal note",
};

export type CampaignRequestEvent = {
  id: string;
  requestId: string;
  actorId: string | null;
  actorName: string | null;
  kind: RequestEventKind;
  note: string | null;
  internal: boolean;
  createdAt: string;
};

export type AdminReviewSummary = {
  pendingReview: number;
  approvedToday: number;
  rejectedToday: number;
  changesRequested: number;
};

export const CAMPAIGN_GOALS = [
  "Brand Awareness",
  "Product Launch",
  "Sales & Conversions",
  "App Installs",
  "Event Promotion",
  "User Generated Content",
] as const;

export { BUSINESS_CATEGORIES, INFLUENCER_CATEGORIES, PRIMARY_PLATFORMS };

export type CampaignRequest = {
  id: string;
  businessId: string;
  businessName: string | null;
  title: string;
  campaignGoal: string | null;
  businessCategory: string | null;
  targetAudience: string | null;
  targetPlatform: string | null;
  targetLocation: string | null;
  requiredViews: number | null;
  budget: number | null;
  durationDays: number | null;
  preferredCreatorCategory: string | null;
  minimumFollowers: number | null;
  maximumFollowers: number | null;
  campaignDescription: string | null;
  attachmentUrl: string | null;
  status: CampaignRequestStatus;
  submittedAt: string | null;
  reviewedAt: string | null;
  /** Admin-internal note. Only populated on admin reads. */
  reviewNotes: string | null;
  /** Reason shown to the business on rejection / changes requested. */
  reviewReason: string | null;
  reviewedBy: string | null;
  approvalReference: string | null;

  createdAt: string;
  updatedAt: string;
};

const optionalText = z.string().trim().max(2000).optional().or(z.literal(""));
const optionalNumber = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

/** Lenient shape used while saving a draft — only a title is required. */
export const campaignRequestDraftSchema = z.object({
  title: z.string().trim().min(3, "Give your campaign a title").max(120),
  businessCategory: optionalText,
  campaignGoal: optionalText,
  campaignDescription: optionalText,
  targetAudience: optionalText,
  targetLocation: optionalText,
  targetPlatform: optionalText,
  requiredViews: optionalNumber,
  budget: optionalNumber,
  durationDays: optionalNumber,
  preferredCreatorCategory: optionalText,
  minimumFollowers: optionalNumber,
  maximumFollowers: optionalNumber,
  attachmentUrl: z.string().trim().optional().or(z.literal("")),
});

export type CampaignRequestDraftInput = z.input<typeof campaignRequestDraftSchema>;
export type CampaignRequestDraftValues = z.output<typeof campaignRequestDraftSchema>;

const requiredText = (message: string) => z.string().trim().min(1, message).max(2000);
const requiredNumber = (message: string) =>
  z
    .union([z.number(), z.string()])
    .transform((v) => (v === "" || v === undefined ? Number.NaN : Number(v)))
    .refine((n) => Number.isFinite(n) && n > 0, message);

/** Strict shape enforced when the business submits the request for review. */
export const campaignRequestSubmitSchema = z
  .object({
    title: z.string().trim().min(3, "Give your campaign a title").max(120),
    businessCategory: requiredText("Select a business category"),
    campaignGoal: requiredText("Select a campaign goal"),
    campaignDescription: z
      .string()
      .trim()
      .min(30, "Describe the campaign in at least 30 characters")
      .max(2000),
    targetAudience: requiredText("Describe your target audience"),
    targetLocation: requiredText("Enter a target location"),
    targetPlatform: requiredText("Select a target platform"),
    requiredViews: requiredNumber("Enter the number of views required"),
    budget: requiredNumber("Enter a budget"),
    durationDays: requiredNumber("Enter the campaign duration in days"),
    preferredCreatorCategory: requiredText("Select a preferred creator category"),
    minimumFollowers: requiredNumber("Enter a minimum follower count"),
    maximumFollowers: requiredNumber("Enter a maximum follower count"),
    attachmentUrl: z.string().trim().optional().or(z.literal("")),
  })
  .refine((v) => v.maximumFollowers >= v.minimumFollowers, {
    message: "Maximum followers must be greater than the minimum",
    path: ["maximumFollowers"],
  });

export type CampaignRequestSubmitValues = z.output<typeof campaignRequestSubmitSchema>;
