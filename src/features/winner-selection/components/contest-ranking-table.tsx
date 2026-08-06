import { numOr } from "@/features/contests/components/detail-row";
import { ResponsiveTable, type ResponsiveColumn } from "@/components/shared/responsive-table";
import type { EvaluationEntry } from "../types";
import { WinnerBadge } from "./winner-badge";

/** Live leaderboard of verified submissions, highest final score first. */
export function ContestRankingTable({ entries }: { entries: EvaluationEntry[] }) {
  if (entries.length === 0) return null;

  const columns: ResponsiveColumn<EvaluationEntry>[] = [
    {
      id: "rank",
      header: "Rank",
      mobile: "hidden",
      cell: (e) => <span className="font-mono text-ink-mute">#{e.rank}</span>,
    },
    {
      id: "influencer",
      header: "Influencer",
      mobile: "title",
      cell: (e) => (
        <span className="text-ink">
          <span className="font-mono text-ink-mute">#{e.rank}</span>{" "}
          {e.influencerName ?? "Influencer"}
          {e.influencerHandle ? (
            <span className="ml-2 text-ink-mute">@{e.influencerHandle}</span>
          ) : null}
        </span>
      ),
    },
    { id: "score", header: "Score", cell: (e) => <span className="text-ink">{e.finalScore}</span> },
    { id: "views", header: "Views", cell: (e) => numOr(e.views) },
    { id: "engagement", header: "Engagement", cell: (e) => `${e.engagementRate}%` },
    {
      id: "status",
      header: "Status",
      mobile: "trailing",
      cell: (e) =>
        e.isWinner ? <WinnerBadge rank={e.winnerRank} /> : <span className="text-ink-mute">—</span>,
    },
  ];

  return (
    <ResponsiveTable
      rows={entries}
      columns={columns}
      rowKey={(e) => e.submissionId}
      minWidth={640}
      empty="No ranked entries yet."
    />
  );
}
