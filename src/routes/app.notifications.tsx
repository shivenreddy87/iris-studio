import { createFileRoute } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — Iris Studio" },
      { name: "description", content: "Every update about your requests, contests and results in one place." },
      { property: "og:title", content: "Notifications — Iris Studio" },
      { property: "og:description", content: "Every update about your requests, contests and results in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Workspace" title="Notifications" description="Updates on campaign requests, contest selections, results and payouts." />
      <EmptyState
        icon={<Bell className="size-8" />}
        title="You are all caught up"
        hint="Notifications about reviews, selections and winners will appear here."
      />
      <MilestoneNotice
        items={[
          "Grouped notifications by contest",
          "Mark all as read",
          "Email digests once delivery is configured",
        ]}
      />
    </div>
  );
}
