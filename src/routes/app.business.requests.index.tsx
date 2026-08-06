import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listCampaignRequests } from "@/features/campaign-requests/requests.functions";
import { CampaignRequestList } from "@/features/campaign-requests/components/campaign-request-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/requests/")({
  head: () => ({
    meta: [
      { title: "Campaign Requests — Iris Studio" },
      {
        name: "description",
        content: "Submit and track the campaign requests your business has sent for review.",
      },
      { property: "og:title", content: "Campaign Requests — Iris Studio" },
      {
        property: "og:description",
        content: "Submit and track the campaign requests your business has sent for review.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <BusinessCampaignRequestsPage />
    </ProfileGate>
  ),
});

function BusinessCampaignRequestsPage() {
  const fetchItems = useServerFn(listCampaignRequests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/business/requests/"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="Campaign Requests"
        description="Submit a campaign brief, track its review status, and see the contest it becomes."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<FileText className="size-8" />}
            title="No campaign requests yet"
            hint="Submit your first brief and our team will review it and turn it into a contest."
          />
        }
      >
        <CampaignRequestList requests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Submit a campaign brief with budget and timing",
          "Live review status from the admin team",
          "Automatic link to the contest created from your request",
        ]}
      />
    </div>
  );
}
