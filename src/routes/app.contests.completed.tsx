import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyCompletedContests } from "@/features/contests/contests.functions";
import { ContestList } from "@/features/contests/components/contest-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/contests/completed")({
  head: () => ({
    meta: [
      { title: "Completed Contests — Iris Studio" },
      { name: "description", content: "Your history of finished contests and their results." },
      { property: "og:title", content: "Completed Contests — Iris Studio" },
      {
        property: "og:description",
        content: "Your history of finished contests and their results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <CompletedContestsPage />
    </ProfileGate>
  ),
});

function CompletedContestsPage() {
  const fetchItems = useServerFn(listMyCompletedContests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/contests/completed"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Completed Contests"
        description="Every contest you participated in that has finished, with its final result."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<ListChecks className="size-8" />}
            title="No completed contests yet"
            hint="Finished contests move here automatically with their outcome."
          />
        }
      >
        <ContestList contests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Result and ranking per contest",
          "Judging summary from the admin team",
          "Downloadable participation history",
        ]}
      />
    </div>
  );
}
