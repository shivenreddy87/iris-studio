import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/requests/new")({
  head: () => ({
    meta: [
      { title: "New Campaign Request — Iris Studio" },
      {
        name: "description",
        content: "Send a new campaign brief to the Iris Studio team for review.",
      },
      { property: "og:title", content: "New Campaign Request — Iris Studio" },
      {
        property: "og:description",
        content: "Send a new campaign brief to the Iris Studio team for review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <NewCampaignRequestPage />
    </ProfileGate>
  ),
});

function NewCampaignRequestPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="New Campaign Request"
        description="Describe the campaign you want to run. Our team reviews every brief before creating a contest."
      />
      <EmptyState
        icon={<FilePlus2 className="size-8" />}
        title="Request form arriving shortly"
        hint="The brief form is being finalised so every field maps to the contest it creates."
      />
      <MilestoneNotice
        items={[
          "Brief, goal, budget and preferred dates",
          "Draft saving before submission",
          "Confirmation and review-status notifications",
        ]}
      />
    </div>
  );
}
