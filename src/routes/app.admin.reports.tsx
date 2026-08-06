import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/shared/page-header";
import { ReportGrid } from "@/features/platform-admin/components/report-grid";
import { generatePlatformReport } from "@/features/platform-admin/admin.functions";
import type { ReportKind } from "@/features/platform-admin/types";

export const Route = createFileRoute("/app/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Iris Studio" },
      {
        name: "description",
        content: "Download contest, campaign, winner, payout, user and activity reports.",
      },
      { property: "og:title", content: "Reports — Iris Studio" },
      {
        property: "og:description",
        content: "Download contest, campaign, winner, payout, user and activity reports.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminReportsPage,
});

const REPORTS = [
  { kind: "contest" as ReportKind, title: "Contest report", description: "Every contest with applications, submissions and reward totals." },
  { kind: "campaign_request" as ReportKind, title: "Campaign request report", description: "Requests with status, budget and review timestamps." },
  { kind: "winner" as ReportKind, title: "Winner report", description: "Ranked winners with scores and reward amounts." },
  { kind: "payout" as ReportKind, title: "Payout report", description: "Payout ledger with status and settlement dates." },
  { kind: "business" as ReportKind, title: "Business report", description: "Business accounts with lifetime activity rollups." },
  { kind: "influencer" as ReportKind, title: "Influencer report", description: "Influencer accounts with applications, wins and rewards." },
  { kind: "user" as ReportKind, title: "User report", description: "All registered profiles with join dates." },
  { kind: "activity" as ReportKind, title: "Activity report", description: "Recent platform-wide audit events." },
];

function AdminReportsPage() {
  const generate = useServerFn(generatePlatformReport);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Administration"
        title="Reports"
        description="Generated on demand from live data and downloaded as CSV."
      />
      <ReportGrid
        reports={REPORTS}
        generate={async (kind) => (await generate({ data: { kind } })).rows}
      />
    </div>
  );
}
