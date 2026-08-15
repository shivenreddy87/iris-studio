import { formatTierRange, sortTiers } from "../reward-calculation";
import type { RewardTier } from "../types";

const nf = new Intl.NumberFormat();

/** Read-only ladder used on contest detail pages for every role. */
export function RewardTierTable({
  tiers,
  highlightTierId,
}: {
  tiers: RewardTier[];
  highlightTierId?: string | null;
}) {
  if (tiers.length === 0) {
    return <p className="text-sm text-ink-mute">No performance tiers configured for this contest.</p>;
  }

  return (
    <ul className="divide-y divide-hairline">
      {sortTiers(tiers).map((tier) => (
        <li
          key={tier.id}
          className={`flex items-center justify-between gap-4 py-3 ${
            highlightTierId === tier.id ? "text-ink" : "text-ink-mute"
          }`}
        >
          <span className="text-sm">{formatTierRange(tier)}</span>
          <span
            className={`font-mono text-sm ${
              highlightTierId === tier.id ? "text-violet" : "text-ink"
            }`}
          >
            ₹{nf.format(tier.rewardAmount)}
          </span>
        </li>
      ))}
    </ul>
  );
}
