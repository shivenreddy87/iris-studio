import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyWins } from "@/features/contests/contests.functions";
import { ContestWinnerList } from "@/features/contests/components/contest-winner-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/contests/won")({
  head: () => ({
    meta: [
      { title: "Won Contests — Iris Studio" },
      {
        name: "description",
        content: "The contests you have won and the rewards attached to them.",
      },
      { property: "og:title", content: "Won Contests — Iris Studio" },
      {
        property: "og:description",
        content: "The contests you have won and the rewards attached to them.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <WonContestsPage />
    </ProfileGate>
  ),
});

function WonContestsPage() {
  const fetchItems = useServerFn(listMyWins);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/contests/won"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Won Contests"
        description="Contests where you were declared a winner. Rewards are settled manually by the team."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Award className="size-8" />}
            title="No wins yet"
            hint="Win a contest and it will be listed here along with the reward details."
          />
        }
      >
        <ContestWinnerList winners={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Winner announcement details",
          "Reward amount and payout status",
          "Winner notifications",
        ]}
      />
    </div>
  );
}
