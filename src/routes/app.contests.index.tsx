import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listOpenContests } from "@/features/contests/contests.functions";
import { ContestList } from "@/features/contests/components/contest-list";

export const Route = createFileRoute("/app/contests/")({
  head: () => ({
    meta: [
      { title: "Available Contests — Iris Studio" },
      {
        name: "description",
        content: "Browse open contests and enter the ones that fit your audience.",
      },
      { property: "og:title", content: "Available Contests — Iris Studio" },
      {
        property: "og:description",
        content: "Browse open contests and enter the ones that fit your audience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AvailableContestsPage,
});

function AvailableContestsPage() {
  const fetchItems = useServerFn(listOpenContests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/contests/"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Available Contests"
        description="Contests currently open for entries. Enter manually and the admin team selects participants."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="No open contests right now"
            hint="New contests appear here as soon as the team publishes them."
          />
        }
      >
        <ContestList contests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "One-tap contest entry with a short pitch",
          "Entry deadlines and reward details",
          "Notifications when new contests open",
        ]}
      />
    </div>
  );
}
