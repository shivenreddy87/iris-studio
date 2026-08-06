import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listAllContests } from "@/features/contests/contests.functions";
import { ContestList } from "@/features/contests/components/contest-list";

export const Route = createFileRoute("/app/admin/contests/")({
  head: () => ({
    meta: [
      { title: "Contests — Iris Studio Admin" },
      { name: "description", content: "Create and manage contests across every stage of their lifecycle." },
      { property: "og:title", content: "Contests — Iris Studio Admin" },
      { property: "og:description", content: "Create and manage contests across every stage of their lifecycle." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContestsPage,
});

function AdminContestsPage() {
  const fetchItems = useServerFn(listAllContests);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["/app/admin/contests/"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Admin" title="Contests" description="Every contest on the platform, from draft through judging to completion." />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="No contests yet"
            hint="Create a contest from an approved campaign request to get started."
          />
        }
      >
        <ContestList contests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Create and publish contests",
          "Move contests through their lifecycle",
          "Set duration, reward and participant caps",
        ]}
      />
    </div>
  );
}
