import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { PAYOUT_STATUS_LABELS, PAYOUT_STATUS_TONES, type PayoutStatus } from "../types";

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return (
    <StatusBadge
      label={PAYOUT_STATUS_LABELS[status]}
      tone={PAYOUT_STATUS_TONES[status] as StatusTone}
    />
  );
}
