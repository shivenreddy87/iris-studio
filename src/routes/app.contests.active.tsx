import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyActiveContests } from "@/features/contests/contests.functions";
import { ContestList } from "@/features/contests/components/contest-list";

export const Route = createFileRoute("/app/contests/active")({
  head: () => ({
    meta: [
      { title: "Active Contests — Iris Studio" },
      { name: "description", content: "Track the contests you are currently participating in." },
      { property: "og:title", content: "Active Contests — Iris Studio" },
      {
        property: "og:description",
        content: "Track the contests you are currently participating in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ActiveContestsPage,
});

function ActiveContestsPage() {
  const fetchItems = useServerFn(listMyActiveContests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/contests/active"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Active Contests"
        description="Contests you were selected for that are currently running."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<PlayCircle className="size-8" />}
            title="No active contests"
            hint="Once you are selected for a contest it will show up here for the duration of the run."
          />
        }
      >
        <ContestList contests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Deliverable checklist per contest",
          "Submission upload and status",
          "Countdown to the contest end date",
        ]}
      />
    </div>
  );
}
