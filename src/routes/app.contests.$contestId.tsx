import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { getContestForInfluencer } from "@/features/contests/discovery.functions";
import { ContestDetailHeader } from "@/features/contests/components/contest-detail-header";
import { ContestCountdown } from "@/features/contests/components/contest-countdown";
import { ContestMetaCard } from "@/features/contests/components/contest-meta-card";
import { EligibilityBanner } from "@/features/contests/components/eligibility-banner";
import { ApplyPanel } from "@/features/contest-applications/components/apply-panel";
import { SavedContestButton } from "@/features/contests/components/saved-contest-button";
import { EligibilityCard } from "@/features/contests/components/eligibility-card";
import { RewardCard } from "@/features/contests/components/reward-card";
import { ContestDates } from "@/features/contests/components/contest-dates";
import { ContestRules } from "@/features/contests/components/contest-rules";
import { ContestTimeline } from "@/features/contests/components/contest-timeline";
import { Panel, dash } from "@/features/contests/components/detail-row";
import { AttachmentPreview } from "@/features/campaign-requests/components/attachment-preview";

export const Route = createFileRoute("/app/contests/$contestId")({
  head: () => ({
    meta: [
      { title: "Contest — Iris Studio" },
      { name: "description", content: "Contest brief, rules, reward, eligibility and timeline." },
      { property: "og:title", content: "Contest — Iris Studio" },
      {
        property: "og:description",
        content: "Contest brief, rules, reward, eligibility and timeline.",
      },
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
  const { contestId } = Route.useParams();
  const fetchContest = useServerFn(getContestForInfluencer);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contests", "detail", contestId],
    queryFn: () => fetchContest({ data: { contestId } }),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Contest"
        description="The full brief, rules, timeline and reward for this contest."
        actions={
          <Button variant="ghost" asChild>
            <Link to="/app/contests">
              <ArrowLeft className="size-4" />
              Back to contests
            </Link>
          </Button>
        }
      />

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!data}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="Contest unavailable"
            hint="This contest is not published, or it is no longer open to influencers."
          />
        }
      >
        {data ? (
          <div className="space-y-6">
            <ContestDetailHeader
              contest={data.contest}
              availability={data.availability}
              actions={
                <SavedContestButton contestId={data.contest.id} saved={data.saved} />
              }
            />

            <EligibilityBanner eligibility={data.eligibility} availability={data.availability} />

            <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="space-y-6">
                <Panel title="Campaign brief">
                  <p className="whitespace-pre-wrap text-sm text-ink-dim">
                    {dash(data.contest.description)}
                  </p>
                </Panel>
                <ContestRules contest={data.contest} />
                <ContestMetaCard contest={data.contest} />
                <EligibilityCard contest={data.contest} />
                <RewardCard contest={data.contest} />
                <ContestDates contest={data.contest} />
                <ContestApplicationPanel
                  eligibility={data.eligibility}
                  availability={data.availability}
                />
                <Panel title="Attachment">
                  <AttachmentPreview path={data.contest.attachmentUrl} />
                </Panel>
              </div>

              <div className="space-y-6">
                <ContestCountdown availability={data.availability} />
                <Panel title="Contest timeline">
                  <ContestTimeline events={data.events} />
                </Panel>
              </div>
            </div>
          </div>
        ) : null}
      </DataSection>
    </div>
  );
}
