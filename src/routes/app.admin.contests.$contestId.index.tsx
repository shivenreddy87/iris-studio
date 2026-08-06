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

export const Route = createFileRoute("/app/admin/contests/$contestId/")({
  head: () => ({
    meta: [
      { title: "Manage Contest — Iris Studio" },
      {
        name: "description",
        content: "Manage the lifecycle, rules and history of a single contest.",
      },
      { property: "og:title", content: "Manage Contest — Iris Studio" },
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
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
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
            <ContestHeader contest={contest} actions={<ContestLifecycleActions contest={contest} />} />
            <ContestSummary contest={contest} />
            <Panel title="History">
              <ContestTimeline events={events} />
            </Panel>
          </div>
        ) : null}
      </DataSection>
    </div>
  );
}
