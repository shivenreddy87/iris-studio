import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { CONTEST_STATUS_LABELS, type ContestStatus } from "../types";

const TONES: Record<ContestStatus, StatusTone> = {
  draft: "neutral",
  published: "info",
  applications_open: "active",
  applications_closed: "warning",
  participant_selection: "warning",
  live: "active",
  completed: "success",
  archived: "neutral",
};

export function ContestStatusBadge({ status }: { status: ContestStatus }) {
  return <StatusBadge label={CONTEST_STATUS_LABELS[status]} tone={TONES[status]} />;
}
