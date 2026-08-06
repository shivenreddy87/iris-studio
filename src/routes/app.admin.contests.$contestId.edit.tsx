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
import { ContestWizard } from "@/features/contests/components/contest-wizard";

export const Route = createFileRoute("/app/admin/contests/$contestId/edit")({
  head: () => ({
    meta: [
      { title: "Contest Builder — Iris Studio" },
      { name: "description", content: "Configure eligibility, rewards, timeline and rules." },
      { property: "og:title", content: "Contest Builder — Iris Studio" },
      {
        property: "og:description",
        content: "Configure eligibility, rewards, timeline and rules.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContestBuilderPage,
});

function AdminContestBuilderPage() {
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
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Contest Builder"
        description="Work through each step, save drafts as you go, then publish."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!contest}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="Contest not found"
            hint="Start a new contest from an approved campaign request."
          />
        }
      >
        {contest ? (
          <div className="space-y-6">
            <ContestHeader contest={contest} />
            <ContestWizard contest={contest} />
          </div>
        ) : null}
      </DataSection>
    </div>
  );
}
