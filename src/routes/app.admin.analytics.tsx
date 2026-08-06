import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, Building2, ShieldAlert, Trophy, Users, Wallet } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  AnalyticsCard,
  MetricCard,
  StatisticsGrid,
} from "@/features/analytics/components/analytics-card";
import { AnalyticsChart } from "@/features/analytics/components/analytics-chart";
import { DateRangeFilter } from "@/features/analytics/components/date-range-filter";
import { ExportButton } from "@/features/analytics/components/export-button";
import {
  useCampaignAnalytics,
  usePayoutAnalytics,
  usePlatformAnalytics,
  useSubmissionAnalytics,
  useWinnerAnalytics,
} from "@/features/analytics/hooks/use-analytics";
import { formatCurrency, formatPercent } from "@/features/analytics/chart.helpers";
import type { DateRangeKey } from "@/features/analytics/types";

export const Route = createFileRoute("/app/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Platform Analytics — Iris Studio" },
      {
        name: "description",
        content: "Growth, contest, submission, winner and payout analytics for the platform.",
      },
      { property: "og:title", content: "Platform Analytics — Iris Studio" },
      {
        property: "og:description",
        content: "Growth, contest, submission, winner and payout analytics for the platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const [range, setRange] = useState<DateRangeKey>("30d");
  const platform = usePlatformAnalytics(range);
  const campaigns = useCampaignAnalytics(range);
  const submissions = useSubmissionAnalytics(range);
  const winners = useWinnerAnalytics();
  const payouts = usePayoutAnalytics(range);

  const data = platform.data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Analytics"
        title="Platform analytics"
        description="Every number is derived from live campaign, contest, submission, winner and payout data."
        actions={
          <>
            <DateRangeFilter value={range} onChange={setRange} />
            <ExportButton
              filename="platform-analytics"
              rows={
                data
                  ? [
                      { metric: "Businesses", value: data.users.businesses },
                      { metric: "Influencers", value: data.users.influencers },
                      { metric: "Contests", value: data.contests.total },
                      { metric: "Applications", value: data.engagement.applications },
                      { metric: "Rewards awarded", value: data.rewards.awarded },
                      { metric: "Rewards paid", value: data.rewards.paid },
                    ]
                  : []
              }
            />
          </>
        }
      />

      <StatisticsGrid>
        <MetricCard
          label="Businesses"
          value={data?.users.businesses ?? "—"}
          icon={<Building2 className="size-4" />}
        />
        <MetricCard
          label="Influencers"
          value={data?.users.influencers ?? "—"}
          icon={<Users className="size-4" />}
        />
        <MetricCard
          label="Contests"
          value={data?.contests.total ?? "—"}
          hint={`${data?.contests.live ?? 0} live · ${data?.contests.completed ?? 0} completed`}
          icon={<Trophy className="size-4" />}
        />
        <MetricCard
          label="Rewards paid"
          value={formatCurrency(data?.rewards.paid)}
          hint={`${formatCurrency(data?.rewards.pending)} pending`}
          icon={<Wallet className="size-4" />}
        />
      </StatisticsGrid>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AnalyticsCard title="Business growth" description="New business accounts per day.">
          <AnalyticsChart kind="area" data={data?.growth.businesses ?? []} />
        </AnalyticsCard>
        <AnalyticsCard title="Influencer growth" description="New influencer accounts per day.">
          <AnalyticsChart
            kind="area"
            data={data?.growth.influencers ?? []}
            color="#F0647D"
          />
        </AnalyticsCard>
        <AnalyticsCard title="Contests created" description="Contest creation trend.">
          <AnalyticsChart kind="line" data={data?.growth.contests ?? []} color="#4ADE80" />
        </AnalyticsCard>
        <AnalyticsCard title="Applications" description="Application volume over time.">
          <AnalyticsChart kind="line" data={data?.growth.applications ?? []} color="#38BDF8" />
        </AnalyticsCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <AnalyticsCard
          title="Campaign requests"
          description={`Approval rate ${formatPercent(campaigns.data?.approvalRate)}`}
        >
          <AnalyticsChart kind="pie" data={campaigns.data?.byStatus ?? []} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Submissions"
          description={`Avg engagement ${formatPercent(submissions.data?.avgEngagement)}`}
        >
          <AnalyticsChart kind="bar" data={submissions.data?.byStatus ?? []} color="#FBBF24" />
        </AnalyticsCard>
        <AnalyticsCard
          title="Payouts"
          description={`${formatCurrency(payouts.data?.totalPaid)} settled`}
        >
          <AnalyticsChart kind="bar" data={payouts.data?.byStatus ?? []} color="#4ADE80" />
        </AnalyticsCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AnalyticsCard title="Winners by rank" description="Distribution of awarded ranks.">
          <AnalyticsChart kind="bar" data={winners.data?.byRank ?? []} />
        </AnalyticsCard>
        <AnalyticsCard
          title="Platform health"
          description="Items that need operator attention."
        >
          <StatisticsGrid columns={2}>
            <MetricCard
              label="Stuck requests"
              value={data?.health.stuckRequests ?? 0}
              icon={<ShieldAlert className="size-4" />}
            />
            <MetricCard
              label="Contests without participants"
              value={data?.health.contestsWithoutParticipants ?? 0}
              icon={<Activity className="size-4" />}
            />
            <MetricCard
              label="Unverified submissions"
              value={data?.health.unverifiedSubmissions ?? 0}
            />
            <MetricCard label="Stale payouts" value={data?.health.stalePayouts ?? 0} />
          </StatisticsGrid>
        </AnalyticsCard>
      </div>
    </div>
  );
}
