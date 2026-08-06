import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { Panel, money, numOr } from "@/features/contests/components/detail-row";
import { positionLabel } from "../types";
import { getMyContestOutcome, getMySubmissionMetrics } from "../winner.functions";
import { winnerKeys } from "../hooks/use-winners";
import { NotSelectedBadge, WinnerBadge } from "./winner-badge";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="mt-1 text-lg font-medium text-ink">{value}</p>
    </div>
  );
}

/**
 * Influencer-facing outcome for a single contest.
 * Only their own submission and result are ever shown — never other participants.
 */
export function MyResultCard({ contestId }: { contestId: string }) {
  const fetchOutcome = useServerFn(getMyContestOutcome);
  const fetchMetrics = useServerFn(getMySubmissionMetrics);

  const { data: outcome, isLoading } = useQuery({
    queryKey: winnerKeys.myOutcome(contestId),
    queryFn: () => fetchOutcome({ data: { contestId } }),
  });
  const { data: metrics } = useQuery({
    queryKey: winnerKeys.myMetrics(contestId),
    queryFn: () => fetchMetrics({ data: { contestId } }),
    enabled: Boolean(outcome),
  });

  if (isLoading) {
    return (
      <Panel title="Your result">
        <p className="text-sm text-ink-mute">Loading your result…</p>
      </Panel>
    );
  }
  if (!outcome) return null;

  const finalized = outcome.contestStatus === "completed" || outcome.contestStatus === "archived";

  return (
    <Panel title="Your result">
      {!finalized ? (
        <p className="text-sm text-ink-mute">
          This contest is still running. Your result appears here once winners are announced.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {outcome.isWinner && outcome.rank ? (
            <>
              <WinnerBadge rank={outcome.rank} />
              <p className="text-sm text-ink">
                Congratulations — you finished {positionLabel(outcome.rank)}.
              </p>
            </>
          ) : (
            <>
              <NotSelectedBadge />
              <p className="text-sm text-ink-dim">
                You were not selected as a winner for this contest.
              </p>
            </>
          )}
        </div>
      )}

      {finalized && outcome.isWinner ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-surface-3 px-4 py-3">
          <Trophy className="size-4 text-violet" />
          <p className="text-sm text-ink">
            Reward{" "}
            <span className="font-medium">{money(outcome.rewardAmount)}</span> — payouts are settled
            manually by the team.
          </p>
        </div>
      ) : null}

      {metrics ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Views" value={numOr(metrics.views)} />
          <Metric label="Likes" value={numOr(metrics.likes)} />
          <Metric label="Comments" value={numOr(metrics.comments)} />
          <Metric
            label="Engagement rate"
            value={metrics.engagementRate ? `${metrics.engagementRate}%` : "—"}
          />
          {metrics.published ? (
            <Metric label="Final score" value={metrics.finalScore} />
          ) : null}
        </div>
      ) : null}
    </Panel>
  );
}
