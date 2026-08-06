import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { money } from "@/features/contests/components/detail-row";
import type { Contest } from "@/features/contests/types";
import { getEvaluationBoard } from "../winner.functions";
import { winnerKeys, useInvalidateWinners } from "../hooks/use-winners";
import type { EvaluationBoard } from "../types";
import { EvaluationRow } from "./evaluation-row";
import { ContestRankingTable } from "./contest-ranking-table";
import { FinalizeWinnersDialog } from "./finalize-winners-dialog";

/**
 * Admin workspace: score verified submissions, rank creators and declare winners.
 * Everything here is rejected server-side once the contest is completed.
 */
export function WinnerEvaluationTable({ contest }: { contest: Contest }) {
  const fetchBoard = useServerFn(getEvaluationBoard);
  const queryClient = useQueryClient();
  const invalidate = useInvalidateWinners();

  const { data, isLoading, error } = useQuery({
    queryKey: winnerKeys.board(contest.id),
    queryFn: () => fetchBoard({ data: { contestId: contest.id } }),
  });

  const onChanged = (next: EvaluationBoard) => {
    queryClient.setQueryData(winnerKeys.board(contest.id), next);
    invalidate(contest.id);
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Winner evaluation</h3>
          <p className="text-sm text-ink-mute">
            {data
              ? `${data.winnersSelected} of ${data.winnerCount} winners selected · ${data.entries.length} verified submission${data.entries.length === 1 ? "" : "s"}`
              : "Loading verified submissions…"}
            {data?.defaultReward ? ` · Default reward ${money(data.defaultReward)}` : ""}
          </p>
        </div>
        {data && !data.isLocked ? (
          <FinalizeWinnersDialog board={data} onFinalized={() => invalidate(contest.id)} />
        ) : null}
      </header>

      {data?.isLocked ? (
        <p className="rounded-2xl border border-hairline bg-surface-3 p-4 text-sm text-ink-mute">
          {data.lockReason}
        </p>
      ) : null}

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!data || data.entries.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="No verified submissions yet"
            hint="Verify submissions before evaluating winners."
          />
        }
      >
        {data ? (
          <div className="space-y-5">
            <ContestRankingTable entries={data.entries} />
            <div className="space-y-4">
              {data.entries.map((entry) => (
                <EvaluationRow
                  key={entry.submissionId}
                  entry={entry}
                  board={data}
                  onChanged={onChanged}
                />
              ))}
            </div>
          </div>
        ) : null}
      </DataSection>
    </section>
  );
}
