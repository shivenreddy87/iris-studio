import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { getContest } from "@/features/contests/contest.functions";
import { contestKeys } from "@/features/contests/hooks/use-contests";
import { ContestHeader } from "@/features/contests/components/contest-header";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { MyResultCard } from "@/features/winner-selection/components/my-result-card";

export const Route = createFileRoute("/app/results/$contestId")({
  head: () => ({
    meta: [
      { title: "Contest Result — Project Eros" },
      { name: "description", content: "Your final result and performance for this contest." },
      { property: "og:title", content: "Contest Result — Project Eros" },
      {
        property: "og:description",
        content: "Your final result and performance for this contest.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <ContestResultPage />
    </ProfileGate>
  ),
});

function ContestResultPage() {
  const { contestId } = Route.useParams();
  const fetchContest = useServerFn(getContest);

  const {
    data: contest,
    isLoading,
    error,
  } = useQuery({
    queryKey: contestKeys.detail(contestId),
    queryFn: () => fetchContest({ data: { id: contestId } }),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Influencer"
        title="Contest Result"
        description="Your outcome, performance metrics and reward for this contest."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!contest}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="Contest not found"
            hint="You can only view results for contests you took part in."
          />
        }
      >
        {contest ? (
          <div className="space-y-6">
            <ContestHeader contest={contest} />
            <MyResultCard contestId={contest.id} />
          </div>
        ) : null}
      </DataSection>
    </div>
  );
}
