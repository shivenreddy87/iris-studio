import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyContests } from "@/features/contests/contest.functions";
import { contestKeys } from "@/features/contests/hooks/use-contests";
import { ContestList } from "@/features/contests/components/contest-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/contests/")({
  head: () => ({
    meta: [
      { title: "My Contests — Creoinfo" },
      { name: "description", content: "Contests created from your approved campaign requests." },
      { property: "og:title", content: "My Contests — Creoinfo" },
      {
        property: "og:description",
        content: "Contests created from your approved campaign requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <BusinessContestsPage />
    </ProfileGate>
  ),
});

function BusinessContestsPage() {
  const fetchItems = useServerFn(listMyContests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({ queryKey: contestKeys.mine, queryFn: () => fetchItems() });

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Business"
        title="My Contests"
        description="Every contest built from one of your approved campaign requests."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="No contests yet"
            hint="Once a campaign request is approved, your contest appears here."
          />
        }
      >
        <ContestList contests={data} to="business" />
      </DataSection>
    </div>
  );
}
