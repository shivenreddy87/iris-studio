import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardCheck } from "lucide-react";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import type { Contest } from "@/features/contests/types";
import { listContestSubmissions } from "../submission.functions";
import { submissionKeys } from "../hooks/use-submissions";
import { SUBMISSION_STATUSES, SUBMISSION_STATUS_LABELS, type SubmissionStatus } from "../types";
import { SubmissionCard } from "./submission-card";

type Filter = SubmissionStatus | "all";

const FILTERS: Filter[] = ["all", ...SUBMISSION_STATUSES];

/** Admin workspace: every participant of a live contest and their submission state. */
export function SubmissionReviewTable({ contest }: { contest: Contest }) {
  const [filter, setFilter] = useState<Filter>("all");
  const fetchRows = useServerFn(listContestSubmissions);

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: submissionKeys.forContest(contest.id),
    queryFn: () => fetchRows({ data: { contestId: contest.id } }),
  });

  const rows = useMemo(
    () => (filter === "all" ? data : data.filter((row) => row.status === filter)),
    [data, filter],
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((value) => (
          <Button
            key={value}
            size="sm"
            variant={filter === value ? "default" : "ghost"}
            onClick={() => setFilter(value)}
          >
            {value === "all" ? "All" : SUBMISSION_STATUS_LABELS[value]}
            {value !== "all" ? ` (${data.filter((row) => row.status === value).length})` : ""}
          </Button>
        ))}
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={rows.length === 0}
        empty={
          <EmptyState
            icon={<ClipboardCheck className="size-8" />}
            title="Nothing to review"
            hint="No participants match this filter yet."
          />
        }
      >
        <div className="space-y-4">
          {rows.map((row) => (
            <SubmissionCard key={row.participantId} row={row} />
          ))}
        </div>
      </DataSection>
    </section>
  );
}
