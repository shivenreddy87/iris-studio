import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import {
  deleteCampaignRequestDraft,
  listMyCampaignRequests,
} from "@/features/campaign-requests/requests.functions";
import { CampaignRequestCard } from "@/features/campaign-requests/components/campaign-request-card";
import type {
  CampaignRequest,
  CampaignRequestStatus,
} from "@/features/campaign-requests/types";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/requests/")({
  head: () => ({
    meta: [
      { title: "Campaign Requests — Project Eros" },
      {
        name: "description",
        content: "Submit and track the campaign requests your business has sent for review.",
      },
      { property: "og:title", content: "Campaign Requests — Project Eros" },
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

const SECTIONS: { key: string; title: string; statuses: CampaignRequestStatus[] }[] = [
  { key: "drafts", title: "Drafts", statuses: ["draft"] },
  { key: "submitted", title: "Submitted", statuses: ["submitted", "under_review"] },
  { key: "changes_requested", title: "Changes requested", statuses: ["changes_requested"] },
  { key: "approved", title: "Approved", statuses: ["approved"] },
  { key: "rejected", title: "Rejected", statuses: ["rejected", "cancelled"] },
];

function BusinessCampaignRequestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchItems = useServerFn(listMyCampaignRequests);
  const removeDraft = useServerFn(deleteCampaignRequestDraft);

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaign-requests", "mine"],
    queryFn: () => fetchItems(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => {
      toast.success("Draft deleted.");
      void queryClient.invalidateQueries({ queryKey: ["campaign-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "campaign-requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function actionsFor(request: CampaignRequest) {
    if (request.status === "changes_requested") {
      return (
        <Link
          to="/app/business/requests/$requestId/edit"
          params={{ requestId: request.id }}
          className="text-sm text-violet hover:underline"
        >
          Update &amp; resubmit
        </Link>
      );
    }
    if (request.status === "draft") {
      return (
        <>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              void navigate({
                to: "/app/business/requests/$requestId/edit",
                params: { requestId: request.id },
              })
            }
          >
            Edit draft
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={deleteMutation.isPending}
            onClick={() => {
              if (confirm("Delete this draft? This cannot be undone.")) {
                deleteMutation.mutate(request.id);
              }
            }}
          >
            Delete
          </Button>
        </>
      );
    }
    return (
      <Button size="sm" variant="outline" asChild>
        <Link to="/app/business/requests/$requestId" params={{ requestId: request.id }}>
          View details
        </Link>
      </Button>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="Campaign Requests"
        description="Submit a campaign brief, track its review status, and revisit your full request history."
        actions={
          <Button asChild>
            <Link to="/app/business/requests/new">
              <Plus className="mr-2 size-4" />
              New request
            </Link>
          </Button>
        }
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
        <div className="space-y-10">
          {SECTIONS.map((section) => {
            const items = data.filter((r) => section.statuses.includes(r.status));
            if (items.length === 0) return null;
            return (
              <section key={section.key}>
                <h2 className="mb-4 font-display text-lg font-semibold text-ink">
                  {section.title}
                  <span className="ml-2 font-mono text-xs text-ink-mute">{items.length}</span>
                </h2>
                <div className="space-y-3">
                  {items.map((request) => (
                    <CampaignRequestCard
                      key={request.id}
                      request={request}
                      actions={actionsFor(request)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </DataSection>
    </div>
  );
}
