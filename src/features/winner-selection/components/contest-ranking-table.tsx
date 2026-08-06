import { numOr } from "@/features/contests/components/detail-row";
import type { EvaluationEntry } from "../types";
import { WinnerBadge } from "./winner-badge";

/** Live leaderboard of verified submissions, highest final score first. */
export function ContestRankingTable({ entries }: { entries: EvaluationEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-3xl border border-hairline bg-surface-2">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-hairline font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            <th className="px-4 py-3">Rank</th>
            <th className="px-4 py-3">Influencer</th>
            <th className="px-4 py-3">Score</th>
            <th className="px-4 py-3">Views</th>
            <th className="px-4 py-3">Engagement</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.submissionId} className="border-b border-hairline last:border-0">
              <td className="px-4 py-3 font-mono text-ink-mute">#{entry.rank}</td>
              <td className="px-4 py-3 text-ink">
                {entry.influencerName ?? "Influencer"}
                {entry.influencerHandle ? (
                  <span className="ml-2 text-ink-mute">@{entry.influencerHandle}</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-ink">{entry.finalScore}</td>
              <td className="px-4 py-3 text-ink-dim">{numOr(entry.views)}</td>
              <td className="px-4 py-3 text-ink-dim">{entry.engagementRate}%</td>
              <td className="px-4 py-3">
                {entry.isWinner ? (
                  <WinnerBadge rank={entry.winnerRank} />
                ) : (
                  <span className="text-ink-mute">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
