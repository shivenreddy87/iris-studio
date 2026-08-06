import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClipboardList } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listAllContestEntries } from "@/features/contest-entries/entries.functions";
import { ContestEntryList } from "@/features/contest-entries/components/contest-entry-list";

export const Route = createFileRoute("/app/admin/entries")({
  head: () => ({
    meta: [
      { title: "Participants — Iris Studio Admin" },
      { name: "description", content: "Review contest entries and select participants." },
      { property: "og:title", content: "Participants — Iris Studio Admin" },
      { property: "og:description", content: "Review contest entries and select participants." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminParticipantsPage,
});

function AdminParticipantsPage() {
  const fetchItems = useServerFn(listAllContestEntries);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/admin/entries"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Participants"
        description="Every contest entry submitted by influencers, ready for shortlisting and selection."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<ClipboardList className="size-8" />}
            title="No entries yet"
            hint="Entries appear here as influencers apply to open contests."
          />
        }
      >
        <ContestEntryList entries={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Shortlist and select participants",
          "Bulk decisions per contest",
          "Automatic selection notifications",
        ]}
      />
    </div>
  );
}
