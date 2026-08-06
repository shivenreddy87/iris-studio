import { Link } from "@tanstack/react-router";
import { StatusBadge } from "@/components/shared/status-badge";
import type { ContestWinner } from "../types";

export function ContestWinnerList({ winners }: { winners: ContestWinner[] }) {
  return (
    <div className="space-y-3">
      {winners.map((winner) => (
        <Link
          key={winner.id}
          to="/app/contests/$contestId"
          params={{ contestId: winner.contestId }}
          className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-violet/30"
        >
          <div>
            <p className="font-display text-base font-semibold text-ink">{winner.contestTitle}</p>
            <p className="text-sm text-ink-dim">{winner.influencerName ?? "Influencer"}</p>
          </div>
          <StatusBadge label={`Position ${winner.position}`} tone="success" />
        </Link>
      ))}
    </div>
  );
}
