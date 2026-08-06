import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listAllWinners } from "@/features/winner-selection/winner.functions";
import { ContestWinnerList } from "@/features/contests/components/contest-winner-list";

export const Route = createFileRoute("/app/admin/winners")({
  head: () => ({
    meta: [
      { title: "Winners — Project Eros Admin" },
      { name: "description", content: "Declare and review contest winners." },
      { property: "og:title", content: "Winners — Project Eros Admin" },
      { property: "og:description", content: "Declare and review contest winners." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminWinnersPage,
});

function AdminWinnersPage() {
  const fetchItems = useServerFn(listAllWinners);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/admin/winners"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Winners"
        description="Declared winners across all contests, with reward details."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Award className="size-8" />}
            title="No winners declared yet"
            hint="Declare winners from a contest once judging is complete."
          />
        }
      >
        <ContestWinnerList winners={data} />
      </DataSection>
    </div>
  );
}
