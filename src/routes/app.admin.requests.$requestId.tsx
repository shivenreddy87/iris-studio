import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/requests/$requestId")({
  head: () => ({
    meta: [
      { title: "Review Campaign Request — Iris Studio" },
      { name: "description", content: "Review a single campaign request and decide its outcome." },
      { property: "og:title", content: "Review Campaign Request — Iris Studio" },
      {
        property: "og:description",
        content: "Review a single campaign request and decide its outcome.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCampaignRequestDetailPage,
});

function AdminCampaignRequestDetailPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Review Campaign Request"
        description="Full brief with approve, reject and convert-to-contest actions."
      />
      <EmptyState
        icon={<FileText className="size-8" />}
        title="Request details unavailable"
        hint="Request records land in the next milestone; this page is already wired to its final URL."
      />
      <MilestoneNotice
        items={[
          "Approve, reject or request changes",
          "Create a contest pre-filled from this brief",
          "Review audit trail",
        ]}
      />
    </div>
  );
}
