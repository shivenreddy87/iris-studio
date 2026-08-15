import { Wallet } from "lucide-react";
import type { PayoutProgress } from "../types";

function money(currency: string, value: number) {
  return `${currency} ${value.toLocaleString()}`;
}

/**
 * Aggregate payout progress for businesses. Deliberately contains no winner
 * payment information — only counts and totals.
 */
export function PayoutProgressCard({
  progress,
  currency = "INR",
}: {
  progress: PayoutProgress;
  currency?: string;
}) {
  if (progress.totalWinners === 0) return null;

  const pct = Math.round((progress.paid / progress.totalWinners) * 100);
  const stats = [
    { label: "Winners", value: progress.totalWinners },
    { label: "Pending", value: progress.pending },
    { label: "Processing", value: progress.processing },
    { label: "Paid", value: progress.paid },
    { label: "Failed", value: progress.failed },
  ];

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex items-center gap-2">
        <Wallet className="size-4 text-violet" />
        <h3 className="font-display text-base font-semibold text-ink">Reward payouts</h3>
      </div>
      <p className="mt-1 text-sm text-ink-mute">
        Rewards are settled manually by the Creoinfo payouts team.
      </p>

      <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-3">
        <div className="h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-ink-mute">
        {progress.paid} of {progress.totalWinners} winners paid ·{" "}
        {money(currency, progress.paidAmount)} of {money(currency, progress.totalAmount)} settled
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-hairline bg-surface-3 p-3">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              {stat.label}
            </dt>
            <dd className="mt-1 font-display text-lg font-semibold text-ink">{stat.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
