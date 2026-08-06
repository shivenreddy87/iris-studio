import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listAllCampaignRequests } from "@/features/campaign-requests/requests.functions";
import { CampaignRequestList } from "@/features/campaign-requests/components/campaign-request-list";

export const Route = createFileRoute("/app/admin/requests/")({
  head: () => ({
    meta: [
      { title: "Campaign Requests — Iris Studio Admin" },
      {
        name: "description",
        content: "Review incoming campaign requests and convert them into contests.",
      },
      { property: "og:title", content: "Campaign Requests — Iris Studio Admin" },
      {
        property: "og:description",
        content: "Review incoming campaign requests and convert them into contests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCampaignRequestsPage,
});

function AdminCampaignRequestsPage() {
  const fetchItems = useServerFn(listAllCampaignRequests);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["/app/admin/requests/"],
    queryFn: () => fetchItems(),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Campaign Requests"
        description="Every brief submitted by businesses, ready for review and conversion into a contest."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<FileText className="size-8" />}
            title="No requests to review"
            hint="Submitted briefs land here for review."
          />
        }
      >
        <CampaignRequestList requests={data} />
      </DataSection>
      <MilestoneNotice
        items={[
          "Approve or reject with review notes",
          "Convert an approved request into a contest",
          "Notify the business of the decision",
        ]}
      />
    </div>
  );
}
