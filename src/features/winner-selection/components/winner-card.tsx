import { money, numOr } from "@/features/contests/components/detail-row";
import { positionLabel, type ContestWinnerEntry } from "../types";
import { WinnerBadge } from "./winner-badge";

/** A single winner row. Never renders contact details. */
export function WinnerCard({
  winner,
  showContest = false,
}: {
  winner: ContestWinnerEntry;
  showContest?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <WinnerBadge rank={winner.rank} />
          <h4 className="mt-2 truncate font-display text-base font-semibold text-ink">
            {showContest ? winner.contestTitle : (winner.influencerName ?? "Influencer")}
          </h4>
          <p className="mt-1 text-xs text-ink-mute">
            {showContest
              ? (winner.businessCategory ?? "Contest")
              : winner.influencerHandle
                ? `@${winner.influencerHandle}`
                : "—"}
            {winner.completedAt
              ? ` · Completed ${new Date(winner.completedAt).toLocaleDateString()}`
              : ""}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Reward</p>
          <p className="text-xl font-medium text-ink">{money(winner.rewardAmount)}</p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm xs:grid-cols-3">
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Position
          </dt>
          <dd className="mt-1 text-ink">{positionLabel(winner.rank)}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Score</dt>
          <dd className="mt-1 text-ink">{winner.finalScore}</dd>
        </div>
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Views</dt>
          <dd className="mt-1 text-ink">{numOr(winner.views)}</dd>
        </div>
      </dl>

      {winner.winnerNotes ? (
        <p className="mt-3 whitespace-pre-wrap text-sm text-ink-dim">{winner.winnerNotes}</p>
      ) : null}
    </article>
  );
}

/** Compact ranking list used in results dashboards. */
export function WinnerSummary({ winners }: { winners: ContestWinnerEntry[] }) {
  if (winners.length === 0) {
    return <p className="text-sm text-ink-mute">No winners have been declared yet.</p>;
  }
  return (
    <ol className="space-y-2">
      {winners.map((winner) => (
        <li
          key={winner.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-hairline bg-surface-3 px-4 py-3"
        >
          <span className="text-sm text-ink">
            <span className="font-mono text-xs text-ink-mute">#{winner.rank}</span>{" "}
            {winner.influencerName ?? "Influencer"}
          </span>
          <span className="text-sm text-ink-dim">
            {winner.finalScore} pts · {numOr(winner.views)} views · {money(winner.rewardAmount)}
          </span>
        </li>
      ))}
    </ol>
  );
}
