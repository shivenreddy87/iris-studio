import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/requests/$requestId/")({
  head: () => ({
    meta: [
      { title: "Campaign Request — Iris Studio" },
      {
        name: "description",
        content: "Review the details, status and contest outcome of a campaign request.",
      },
      { property: "og:title", content: "Campaign Request — Iris Studio" },
      {
        property: "og:description",
        content: "Review the details, status and contest outcome of a campaign request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <CampaignRequestDetailPage />
    </ProfileGate>
  ),
});

function CampaignRequestDetailPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="Campaign Request"
        description="Full brief, review history and the contest generated from this request."
      />
      <EmptyState
        icon={<FileText className="size-8" />}
        title="Request details unavailable"
        hint="Request records land in the next milestone; this page is already wired to its final URL."
      />
      <MilestoneNotice
        items={[
          "Full brief and budget breakdown",
          "Admin review notes and decision history",
          "Link through to the resulting contest",
        ]}
      />
    </div>
  );
}
