import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { listMyRewards } from "@/features/manual-payouts/payout.functions";
import { RewardCard } from "@/features/manual-payouts/components/reward-card";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/app/rewards")({
  head: () => ({
    meta: [
      { title: "My Rewards — Iris Studio" },
      {
        name: "description",
        content: "Track your contest reward payouts and submit your payment details.",
      },
      { property: "og:title", content: "My Rewards — Iris Studio" },
      {
        property: "og:description",
        content: "Track your contest reward payouts and submit your payment details.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <RewardsPage />
    </ProfileGate>
  ),
});

function RewardsPage() {
  const { user } = useAuth();
  const fetchRewards = useServerFn(listMyRewards);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["my-rewards"],
    queryFn: () => fetchRewards(),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="My Rewards"
        description="Rewards from contests you have won. Payments are made manually outside the platform and every step is recorded here."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<Wallet className="size-8" />}
            title="No rewards yet"
            hint="When you win a contest, its reward payout will appear here."
          />
        }
      >
        <div className="space-y-5">
          {data.map((entry) => (
            <RewardCard key={entry.payout.id} entry={entry} userId={user?.id ?? ""} />
          ))}
        </div>
      </DataSection>
    </div>
  );
}
