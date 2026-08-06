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
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/contests/$contestId")({
  head: () => ({
    meta: [
      { title: "Contest — Iris Studio" },
      { name: "description", content: "Contest brief, rules, reward and entry status." },
      { property: "og:title", content: "Contest — Iris Studio" },
      { property: "og:description", content: "Contest brief, rules, reward and entry status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <ContestDetailPage />
    </ProfileGate>
  ),
});

function ContestDetailPage() {
  const fetchItems = useServerFn(listOpenContests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/contests/$contestId"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Contest"
        description="The full brief, rules, timeline and reward for this contest."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="Contest details unavailable"
            hint="Contest records land in the next milestone; this page is already wired to its final URL."
          />
        }
      >
        <ContestList contests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Full rules and deliverables",
          "Enter contest action with pitch",
          "Participant and winner announcements",
        ]}
      />
    </div>
  );
}
