import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { getCampaignRequest } from "@/features/campaign-requests/requests.functions";
import { listRequestEvents } from "@/features/campaign-requests/admin-review.functions";
import { CampaignRequestDetail } from "@/features/campaign-requests/components/campaign-request-detail";
import { ApprovalActions } from "@/features/campaign-requests/components/approval-actions";
import { ReviewNotesCard } from "@/features/campaign-requests/components/review-notes-card";

export const Route = createFileRoute("/app/admin/requests/$requestId")({
  head: () => ({
    meta: [
      { title: "Request Review — Project Eros Admin" },
      {
        name: "description",
        content: "Inspect a submitted campaign brief, its targeting and its review history.",
      },
      { property: "og:title", content: "Request Review — Project Eros Admin" },
      {
        property: "og:description",
        content: "Inspect a submitted campaign brief, its targeting and its review history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCampaignRequestDetailPage,
});

function AdminCampaignRequestDetailPage() {
  const { requestId } = Route.useParams();
  const fetchRequest = useServerFn(getCampaignRequest);
  const fetchEvents = useServerFn(listRequestEvents);
  const {
    data: request,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaign-requests", requestId],
    queryFn: () => fetchRequest({ data: { id: requestId } }),
  });
  const { data: events } = useQuery({
    queryKey: ["campaign-request-events", requestId],
    queryFn: () => fetchEvents({ data: { id: requestId } }),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title={request?.title || "Request review"}
        description="Full brief submitted by the business, with status history."
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
        {request ? (
          <CampaignRequestDetail
            request={request}
            events={events ?? []}
            aside={
              <>
                <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
                  <h3 className="mb-4 font-display text-lg font-semibold text-ink">Review</h3>
                  <ApprovalActions request={request} />
                </div>
                <ReviewNotesCard requestId={requestId} events={events ?? []} />
              </>
            }
          />
        ) : null}
      </DataSection>
    </div>
  );
}
