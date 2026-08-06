export type CampaignRequestStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "converted";

export const CAMPAIGN_REQUEST_STATUS_LABELS: Record<CampaignRequestStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Contest created",
};

export type CampaignRequest = {
  id: string;
  businessId: string;
  businessName: string | null;
  title: string;
  brief: string | null;
  goal: string | null;
  budgetAmount: number | null;
  currency: string;
  preferredStartDate: string | null;
  preferredEndDate: string | null;
  status: CampaignRequestStatus;
  contestId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CampaignRequestInput = {
  title: string;
  brief?: string;
  goal?: string;
  budgetAmount?: number;
  currency?: string;
  preferredStartDate?: string;
  preferredEndDate?: string;
};
