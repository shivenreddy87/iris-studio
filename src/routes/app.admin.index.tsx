import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Clock, LayoutDashboard, RefreshCw, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/list-skeleton";
import { getAdminReviewSummary } from "@/features/campaign-requests/admin-review.functions";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Project Eros" },
      {
        name: "description",
        content: "Operational overview of businesses, requests, contests and payouts.",
      },
      { property: "og:title", content: "Admin Dashboard — Project Eros" },
      {
        property: "og:description",
        content: "Operational overview of businesses, requests, contests and payouts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDashboardPage,
});

function SummaryTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
}) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <div className="flex items-center gap-2 text-ink-mute">
        {icon}
        <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold text-ink">{value ?? "—"}</p>
    </div>
  );
}

function AdminDashboardPage() {
  const fetchSummary = useServerFn(getAdminReviewSummary);
  const { data: summary } = useQuery({
    queryKey: ["admin-review-summary"],
    queryFn: () => fetchSummary(),
  });

  const total =
    (summary?.pendingReview ?? 0) +
    (summary?.approvedToday ?? 0) +
    (summary?.rejectedToday ?? 0) +
    (summary?.changesRequested ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Admin Dashboard"
        description="Review queue, running contests and pending payouts at a glance."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          icon={<Clock className="size-4" />}
          label="Pending review"
          value={summary?.pendingReview}
        />
        <SummaryTile
          icon={<CheckCircle2 className="size-4" />}
          label="Approved today"
          value={summary?.approvedToday}
        />
        <SummaryTile
          icon={<XCircle className="size-4" />}
          label="Rejected today"
          value={summary?.rejectedToday}
        />
        <SummaryTile
          icon={<RefreshCw className="size-4" />}
          label="Changes requested"
          value={summary?.changesRequested}
        />
      </div>
      <div className="mt-4">
        <Link to="/app/admin/requests" className="text-sm text-violet hover:underline">
          Open the review queue →
        </Link>
      </div>
      {total === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<LayoutDashboard className="size-8" />}
            title="No operational data yet"
            hint="Counts and queues appear here once campaign requests and contests exist."
          />
        </div>
      ) : null}
    </div>
  );
}
