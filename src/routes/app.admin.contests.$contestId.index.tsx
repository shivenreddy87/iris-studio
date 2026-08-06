import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { getContest, listContestEvents } from "@/features/contests/contest.functions";
import { contestKeys } from "@/features/contests/hooks/use-contests";
import { ContestHeader } from "@/features/contests/components/contest-header";
import { ContestSummary } from "@/features/contests/components/contest-summary";
import { ContestTimeline } from "@/features/contests/components/contest-timeline";
import { ContestLifecycleActions } from "@/features/contests/components/contest-lifecycle-actions";
import { Panel } from "@/features/contests/components/detail-row";
import { AdminApplicationsPanel } from "@/features/contest-applications/components/admin-applications-panel";
import { ApplicationCountsCard } from "@/features/contest-applications/components/application-counts-card";
import { ParticipantSelectionTable } from "@/features/contest-applications/components/participant-selection-table";
import { SubmissionReviewTable } from "@/features/contest-submissions/components/submission-review-table";
import { ContestProgressCard } from "@/features/contest-submissions/components/contest-progress-card";
import { WinnerEvaluationTable } from "@/features/winner-selection/components/winner-evaluation-table";
import { ContestResultsCard } from "@/features/winner-selection/components/contest-results-card";
import type { ContestStatus } from "@/features/contests/types";

/** Contest states where content submission is in play. */
const EXECUTION_STATUSES: ContestStatus[] = ["live", "completed", "archived"];

/** Statuses where the admin manages participant selection instead of read-only review. */
const SELECTION_STATUSES: ContestStatus[] = ["applications_closed", "participant_selection"];

export const Route = createFileRoute("/app/admin/contests/$contestId/")({
  head: () => ({
    meta: [
      { title: "Manage Contest — Project Eros" },
      {
        name: "description",
        content: "Manage the lifecycle, rules and history of a single contest.",
      },
      { property: "og:title", content: "Manage Contest — Project Eros" },
      {
        property: "og:description",
        content: "Manage the lifecycle, rules and history of a single contest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContestDetailPage,
});

function AdminContestDetailPage() {
  const { contestId } = Route.useParams();
  const fetchContest = useServerFn(getContest);
  const fetchEvents = useServerFn(listContestEvents);

  const {
    data: contest,
    isLoading,
    error,
  } = useQuery({
    queryKey: contestKeys.detail(contestId),
    queryFn: () => fetchContest({ data: { id: contestId } }),
  });

  const { data: events = [] } = useQuery({
    queryKey: contestKeys.events(contestId),
    queryFn: () => fetchEvents({ data: { id: contestId } }),
    enabled: Boolean(contest),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Manage Contest"
        description="Lifecycle controls, contest configuration and the full event history."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!contest}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="Contest not found"
            hint="It may have been deleted while it was still a draft."
          />
        }
      >
        {contest ? (
          <div className="space-y-6">
            <ContestHeader
              contest={contest}
              actions={<ContestLifecycleActions contest={contest} />}
            />
            <ContestSummary contest={contest} />
            <ApplicationCountsCard contestId={contest.id} />
            {SELECTION_STATUSES.includes(contest.status) ? (
              <ParticipantSelectionTable contest={contest} />
            ) : (
              <AdminApplicationsPanel contestId={contest.id} />
            )}
            {EXECUTION_STATUSES.includes(contest.status) ? (
              <>
                <ContestProgressCard contestId={contest.id} />
                <Panel title="Content submissions">
                  <SubmissionReviewTable contest={contest} />
                </Panel>
                <WinnerEvaluationTable contest={contest} />
                <ContestResultsCard contestId={contest.id} rewardPool={contest.rewardPool} />
              </>
            ) : null}

            <Panel title="History">
              <ContestTimeline events={events} />
            </Panel>
          </div>
        ) : null}
      </DataSection>
    </div>
  );
}
