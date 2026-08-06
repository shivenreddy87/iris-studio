import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Iris Studio" },
      {
        name: "description",
        content: "Operational overview of businesses, requests, contests and payouts.",
      },
      { property: "og:title", content: "Admin Dashboard — Iris Studio" },
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

function AdminDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Admin Dashboard"
        description="Review queue, running contests and pending payouts at a glance."
      />
      <EmptyState
        icon={<LayoutDashboard className="size-8" />}
        title="No operational data yet"
        hint="Counts and queues appear here once campaign requests and contests exist."
      />
      <MilestoneNotice
        items={[
          "Review queue for new campaign requests",
          "Contests by stage with participant counts",
          "Pending manual payouts",
        ]}
      />
    </div>
  );
}
