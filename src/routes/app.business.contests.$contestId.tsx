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
import { Panel } from "@/features/contests/components/detail-row";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { ApplicationCountsCard } from "@/features/contest-applications/components/application-counts-card";
import { SelectionSummaryCard } from "@/features/contest-applications/components/selection-summary-card";
import { ContestProgressCard } from "@/features/contest-submissions/components/contest-progress-card";
import { ContestResultsCard } from "@/features/winner-selection/components/contest-results-card";
import { ContestPayoutProgress } from "@/features/manual-payouts/components/contest-payout-progress";

export const Route = createFileRoute("/app/business/contests/$contestId")({
  head: () => ({
    meta: [
      { title: "Contest — Project Eros" },
      { name: "description", content: "Read-only view of a contest built from your campaign." },
      { property: "og:title", content: "Contest — Project Eros" },
      {
        property: "og:description",
        content: "Read-only view of a contest built from your campaign.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <BusinessContestDetailPage />
    </ProfileGate>
  ),
});

function BusinessContestDetailPage() {
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
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="Contest"
        description="The contest built from your approved campaign request."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!contest}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="Contest not found"
            hint="This contest may not have been created yet."
          />
        }
      >
        {contest ? (
          <div className="space-y-6">
            <ContestHeader contest={contest} />
            <ContestSummary contest={contest} />
            <ApplicationCountsCard contestId={contest.id} />
            {contest.status === "participant_selection" ||
            contest.status === "live" ||
            contest.status === "completed" ? (
              <SelectionSummaryCard contestId={contest.id} />
            ) : null}
            {contest.status === "live" ||
            contest.status === "completed" ||
            contest.status === "archived" ? (
              <ContestProgressCard contestId={contest.id} />
            ) : null}
            {contest.status === "completed" || contest.status === "archived" ? (
              <>
                <ContestResultsCard contestId={contest.id} rewardPool={contest.rewardPool} />
                <ContestPayoutProgress contestId={contest.id} />
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
