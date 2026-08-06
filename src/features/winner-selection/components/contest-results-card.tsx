import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel, dateOr } from "@/features/contests/components/detail-row";
import { getContestResults } from "../winner.functions";
import { winnerKeys } from "../hooks/use-winners";
import type { ContestResults } from "../types";
import { ResultStatistics } from "./result-statistics";
import { WinnerSummary } from "./winner-card";
import { WinnerTimeline } from "./winner-timeline";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="mt-1 text-xl font-medium text-ink">{value}</p>
    </div>
  );
}

/** Placeholder export: a CSV summary until the formatted report lands. */
function downloadReport(results: ContestResults) {
  const lines = [
    `Contest,${JSON.stringify(results.contestTitle)}`,
    `Status,${results.contestStatus}`,
    `Completed,${results.completedAt ?? ""}`,
    `Participants,${results.totalParticipants}`,
    `Verified submissions,${results.verifiedSubmissions}`,
    `Total views,${results.statistics.totalViews}`,
    `Average engagement rate,${results.statistics.averageEngagementRate}`,
    "",
    "Rank,Influencer,Score,Views,Engagement rate,Reward",
    ...results.winners.map((w) =>
      [
        w.rank,
        JSON.stringify(w.influencerName ?? "Influencer"),
        w.finalScore,
        w.views,
        w.engagementRate,
        w.rewardAmount ?? "",
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `contest-summary-${results.contestId}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Contest outcome report for the owning business and admins.
 * Aggregates plus winner rankings only — no participant contact details.
 */
export function ContestResultsCard({
  contestId,
  rewardPool,
}: {
  contestId: string;
  rewardPool?: number | null;
}) {
  const fetchResults = useServerFn(getContestResults);
  const { data, isLoading } = useQuery({
    queryKey: winnerKeys.results(contestId),
    queryFn: () => fetchResults({ data: { contestId } }),
  });

  if (isLoading) {
    return (
      <Panel title="Contest results">
        <p className="text-sm text-ink-mute">Loading results…</p>
      </Panel>
    );
  }
  if (!data) return null;

  const finalized = data.contestStatus === "completed" || data.contestStatus === "archived";

  return (
    <Panel title="Contest results">
      {!finalized ? (
        <p className="mb-4 text-sm text-ink-mute">
          Winners have not been finalized yet. These figures update as submissions are verified and
          scored.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Participants" value={data.totalParticipants} />
        <Stat label="Verified submissions" value={data.verifiedSubmissions} />
        <Stat label="Winners" value={`${data.winners.length} / ${data.winnerCount}`} />
        <Stat label="Completed" value={dateOr(data.completedAt)} />
      </div>

      <div className="mt-5 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Winner rankings
        </p>
        <WinnerSummary winners={data.winners} />
      </div>

      <div className="mt-5 space-y-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Performance summary
        </p>
        <ResultStatistics statistics={data.statistics} rewardPool={rewardPool ?? null} />
      </div>

      {data.events.length > 0 ? (
        <div className="mt-5 space-y-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Results timeline
          </p>
          <WinnerTimeline events={data.events} />
        </div>
      ) : null}

      <Button
        variant="ghost"
        size="sm"
        className="mt-5"
        disabled={!finalized}
        onClick={() => downloadReport(data)}
      >
        <Download className="mr-2 size-4" />
        Download contest summary report
      </Button>
    </Panel>
  );
}
