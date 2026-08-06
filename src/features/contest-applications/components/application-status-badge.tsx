import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "../types";

const TONES: Record<ApplicationStatus, StatusTone> = {
  submitted: "info",
  withdrawn: "neutral",
  shortlisted: "warning",
  selected: "success",
  rejected: "danger",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <StatusBadge label={APPLICATION_STATUS_LABELS[status]} tone={TONES[status]} />;
}
