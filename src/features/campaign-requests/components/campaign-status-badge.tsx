import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { CAMPAIGN_REQUEST_STATUS_LABELS, type CampaignRequestStatus } from "../types";

const TONES: Record<CampaignRequestStatus, StatusTone> = {
  draft: "neutral",
  submitted: "info",
  under_review: "warning",
  changes_requested: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

export function CampaignStatusBadge({ status }: { status: CampaignRequestStatus }) {
  return <StatusBadge label={CAMPAIGN_REQUEST_STATUS_LABELS[status]} tone={TONES[status]} />;
}
