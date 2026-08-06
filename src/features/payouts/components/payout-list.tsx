import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { PAYOUT_STATUS_LABELS, type Payout, type PayoutStatus } from "../types";

const TONES: Record<PayoutStatus, StatusTone> = {
  pending: "warning",
  processing: "info",
  paid: "success",
  failed: "danger",
};

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  return <StatusBadge label={PAYOUT_STATUS_LABELS[status]} tone={TONES[status]} />;
}

export function PayoutList({ payouts }: { payouts: Payout[] }) {
  return (
    <div className="space-y-3">
      {payouts.map((payout) => (
        <div
          key={payout.id}
          className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-2 p-5"
        >
          <div>
            <p className="font-display text-base font-semibold text-ink">{payout.contestTitle}</p>
            <p className="text-sm text-ink-dim">{payout.influencerName ?? "Influencer"}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-ink">
              {payout.currency} {payout.amount.toLocaleString()}
            </span>
            <PayoutStatusBadge status={payout.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
