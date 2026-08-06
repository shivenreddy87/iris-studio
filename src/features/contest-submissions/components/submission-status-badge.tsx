import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "../types";

const TONES: Record<SubmissionStatus, StatusTone> = {
  pending: "neutral",
  submitted: "info",
  verified: "success",
  flagged: "danger",
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <StatusBadge label={SUBMISSION_STATUS_LABELS[status]} tone={TONES[status]} />;
}
