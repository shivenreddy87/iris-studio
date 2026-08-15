import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Award, ClipboardList, Trophy, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  AnalyticsCard,
  MetricCard,
  StatisticsGrid,
} from "@/features/analytics/components/analytics-card";
import { AnalyticsChart } from "@/features/analytics/components/analytics-chart";
import { DateRangeFilter } from "@/features/analytics/components/date-range-filter";
import { AchievementGrid } from "@/features/analytics/components/achievement-card";
import { ReportGrid } from "@/features/platform-admin/components/report-grid";
import { useDashboardAnalytics } from "@/features/analytics/hooks/use-analytics";
import {
  formatCurrency,
  formatDays,
  formatHours,
  formatPercent,
} from "@/features/analytics/chart.helpers";
import {
  generateBusinessReport,
  generateInfluencerReport,
} from "@/features/platform-admin/admin.functions";
import type { DateRangeKey } from "@/features/analytics/types";
import type { ReportKind } from "@/features/platform-admin/types";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Creoinfo" },
      {
        name: "description",
        content: "Your contest, application, engagement and reward performance in one place.",
      },
      { property: "og:title", content: "Analytics — Creoinfo" },
      {
        property: "og:description",
        content: "Your contest, application, engagement and reward performance in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalyticsPage,
});

const BUSINESS_REPORTS = [
  {
    kind: "contest_summary" as ReportKind,
    title: "Contest summary",
    description: "Applications, submissions and rewards for every contest you ran.",
  },
  {
    kind: "campaign_performance" as ReportKind,
    title: "Campaign performance",
    description: "Campaign requests with status, budget and review timings.",
  },
  {
    kind: "reward_distribution" as ReportKind,
    title: "Reward distribution",
    description: "Payout ledger for the rewards you funded.",
  },
];

const INFLUENCER_REPORTS = [
  {
    kind: "contest_history" as ReportKind,
    title: "Contest history",
    description: "Every contest you applied to and how it progressed.",
  },
  {
    kind: "reward_history" as ReportKind,
    title: "Reward history",
    description: "Your rewards with settlement status and dates.",
  },
  {
    kind: "performance_summary" as ReportKind,
    title: "Performance summary",
    description: "Submission metrics: views, likes, comments and engagement.",
  },
];

function AnalyticsPage() {
  const [range, setRange] = useState<DateRangeKey>("30d");
  const { data, isLoading } = useDashboardAnalytics(range);
  const businessReport = useServerFn(generateBusinessReport);
  const influencerReport = useServerFn(generateInfluencerReport);

  if (isLoading || !data) {
    return <div className="p-10 text-center text-ink-mute">Loading analytics…</div>;
  }

  const business = data.business;
  const influencer = data.influencer;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Analytics"
        title={business ? "Campaign performance" : "My performance"}
        description={
          business
            ? "How your campaign requests and contests are converting."
            : "Your applications, selections, wins and rewards."
        }
        actions={<DateRangeFilter value={range} onChange={setRange} />}
      />

      {business ? (
        <>
          <StatisticsGrid>
            <MetricCard
              label="Requests created"
              value={business.requestsCreated}
              hint={`${formatPercent(business.approvedRate)} approved`}
              icon={<ClipboardList className="size-4" />}
            />
            <MetricCard
              label="Contests"
              value={business.contestsCreated}
              hint={`${business.contestsCompleted} completed`}
              icon={<Trophy className="size-4" />}
            />
            <MetricCard
              label="Applications received"
              value={business.applicationsReceived}
              hint={`${business.participantsSelected} participants selected`}
              icon={<Users className="size-4" />}
            />
            <MetricCard
              label="Rewards distributed"
              value={formatCurrency(business.rewardDistributed)}
              hint={`Avg completion ${formatDays(business.avgCompletionDays)}`}
              icon={<Wallet className="size-4" />}
            />
          </StatisticsGrid>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AnalyticsCard title="Applications over time" description="Interest in your contests.">
              <AnalyticsChart kind="area" data={business.applicationsOverTime} />
            </AnalyticsCard>
            <AnalyticsCard title="Contest breakdown" description="Contests by current status.">
              <AnalyticsChart kind="pie" data={business.contestBreakdown} />
            </AnalyticsCard>
            <AnalyticsCard
              title="Content funnel"
              description={`Verified content rate ${formatPercent(business.completionRate)}`}
            >
              <AnalyticsChart
                kind="funnel"
                data={[
                  { label: "Applications", value: business.applicationsReceived },
                  { label: "Participants", value: business.participantsSelected },
                  { label: "Submissions", value: business.submissionsReceived },
                  { label: "Verified", value: business.verifiedContent },
                ]}
              />
            </AnalyticsCard>
            <AnalyticsCard
              title="Verified performance"
              description="Computed from admin-verified metrics only."
            >
              <StatisticsGrid columns={2}>
                <MetricCard
                  label="Verified views"
                  value={business.verifiedViews.toLocaleString("en-IN")}
                />
                <MetricCard
                  label="Avg views per content"
                  value={business.avgVerifiedViews.toLocaleString("en-IN")}
                />
                <MetricCard
                  label="Cost per verified view"
                  value={formatCurrency(business.costPerVerifiedView)}
                />
                <MetricCard label="Avg engagement" value={formatPercent(business.avgEngagement)} />
                <MetricCard
                  label="Submission progress"
                  value={formatPercent(business.submissionProgress)}
                />
                <MetricCard
                  label="Contest success rate"
                  value={formatPercent(business.contestSuccessRate)}
                />
              </StatisticsGrid>
            </AnalyticsCard>
            <AnalyticsCard
              title="Reward tier distribution"
              description="Finalized rewards grouped by tier amount."
            >
              <AnalyticsChart kind="pie" data={business.rewardTierDistribution} />
            </AnalyticsCard>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">Reports</h2>
            <ReportGrid
              reports={BUSINESS_REPORTS}
              generate={async (kind) => (await businessReport({ data: { kind } })).rows}
            />
          </div>
        </>
      ) : null}

      {influencer ? (
        <>
          <StatisticsGrid>
            <MetricCard
              label="Applications"
              value={influencer.applicationsSubmitted}
              hint={`${formatPercent(influencer.acceptanceRate)} accepted`}
              icon={<ClipboardList className="size-4" />}
            />
            <MetricCard
              label="Selected"
              value={influencer.selected}
              hint={`${formatPercent(influencer.selectionRate)} selection rate`}
              icon={<Users className="size-4" />}
            />
            <MetricCard
              label="Wins"
              value={influencer.wins}
              hint={`${formatPercent(influencer.winRate)} win rate`}
              icon={<Award className="size-4" />}
            />
            <MetricCard
              label="Rewards won"
              value={formatCurrency(influencer.rewardsWon)}
              hint={`${formatCurrency(influencer.rewardsPaid)} paid`}
              icon={<Wallet className="size-4" />}
            />
          </StatisticsGrid>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <AnalyticsCard title="Applications over time" description="Your activity trend.">
              <AnalyticsChart kind="area" data={influencer.applicationsOverTime} />
            </AnalyticsCard>
            <AnalyticsCard title="Score trend" description="Performance score per contest.">
              <AnalyticsChart kind="line" data={influencer.scoreTrend} color="#F0647D" />
            </AnalyticsCard>
            <AnalyticsCard title="Participation" description="Where you stand right now.">
              <StatisticsGrid columns={2}>
                <MetricCard label="Active contests" value={influencer.activeContests} />
                <MetricCard label="Completed" value={influencer.completedContests} />
                <MetricCard
                  label="Verified views"
                  value={influencer.verifiedViews.toLocaleString("en-IN")}
                />
                <MetricCard
                  label="Avg views per content"
                  value={influencer.avgVerifiedViews.toLocaleString("en-IN")}
                />
                <MetricCard
                  label="Avg engagement"
                  value={formatPercent(influencer.avgEngagement)}
                />
                <MetricCard
                  label="Avg submission time"
                  value={formatHours(influencer.avgSubmissionHours)}
                />
              </StatisticsGrid>
            </AnalyticsCard>
            <AnalyticsCard title="Achievements" description="Milestones you have unlocked.">
              <AchievementGrid achievements={influencer.achievements} />
            </AnalyticsCard>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 font-display text-lg font-bold text-ink">Reports</h2>
            <ReportGrid
              reports={INFLUENCER_REPORTS}
              generate={async (kind) => (await influencerReport({ data: { kind } })).rows}
            />
          </div>
        </>
      ) : null}

      {!business && !influencer ? (
        <AnalyticsCard
          title="Platform analytics"
          description="Admin analytics live on the dedicated platform analytics page."
        >
          <p className="text-sm text-ink-dim">Open Analytics from the admin navigation.</p>
        </AnalyticsCard>
      ) : null}
    </div>
  );
}
