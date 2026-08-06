import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { getCampaignRequest } from "@/features/campaign-requests/requests.functions";
import { CampaignRequestDetail } from "@/features/campaign-requests/components/campaign-request-detail";
import { listRequestEvents } from "@/features/campaign-requests/admin-review.functions";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/requests/$requestId/")({
  head: () => ({
    meta: [
      { title: "Campaign Request — Iris Studio" },
      {
        name: "description",
        content: "Review the details, status and review notes of a campaign request.",
      },
      { property: "og:title", content: "Campaign Request — Iris Studio" },
      {
        property: "og:description",
        content: "Review the details, status and review notes of a campaign request.",
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
  const { requestId } = Route.useParams();
  const fetchRequest = useServerFn(getCampaignRequest);
  const {
    data: request,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaign-requests", requestId],
    queryFn: () => fetchRequest({ data: { id: requestId } }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="Campaign Request"
        description="Full brief, review history and the decision made on this request."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!request}
        empty={
          <EmptyState
            icon={<FileText className="size-8" />}
            title="Request not found"
            hint="This request may have been deleted."
          />
        }
      >
        {request ? <BusinessRequestDetail request={request} /> : null}
      </DataSection>
    </div>
  );
}

function BusinessRequestDetail({
  request,
}: {
  request: import("@/features/campaign-requests/types").CampaignRequest;
}) {
  const fetchEvents = useServerFn(listRequestEvents);
  const { data: events } = useQuery({
    queryKey: ["campaign-request-events", request.id],
    queryFn: () => fetchEvents({ data: { id: request.id } }),
  });
  return <CampaignRequestDetail request={request} showEdit events={events ?? []} />;
}
