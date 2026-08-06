import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyContestEntries } from "@/features/contest-entries/entries.functions";
import { ContestEntryList } from "@/features/contest-entries/components/contest-entry-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/entries/")({
  head: () => ({
    meta: [
      { title: "My Applications — Iris Studio" },
      {
        name: "description",
        content: "Track every contest you have applied to and where each application stands.",
      },
      { property: "og:title", content: "My Applications — Iris Studio" },
      {
        property: "og:description",
        content: "Track every contest you have applied to and where each application stands.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <MyApplicationsPage />
    </ProfileGate>
  ),
});

function MyApplicationsPage() {
  const fetchItems = useServerFn(listMyContestEntries);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/entries/"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="My Applications"
        description="Every contest entry you have submitted, with its current selection status."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<ClipboardList className="size-8" />}
            title="No applications yet"
            hint="Enter an available contest and your application will appear here."
          />
        }
      >
        <ContestEntryList entries={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Application status timeline",
          "Withdraw an application before selection",
          "Notification when you are selected",
        ]}
      />
    </div>
  );
}
