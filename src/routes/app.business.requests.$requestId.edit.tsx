import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  getCampaignRequest,
  submitCampaignRequest,
  updateCampaignRequestDraft,
} from "@/features/campaign-requests/requests.functions";
import {
  CampaignRequestForm,
  type CampaignRequestPayload,
} from "@/features/campaign-requests/components/campaign-request-form";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/business/requests/$requestId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Campaign Request — Project Eros" },
      { name: "description", content: "Edit a saved campaign request draft before submitting it." },
      { property: "og:title", content: "Edit Campaign Request — Project Eros" },
      {
        property: "og:description",
        content: "Edit a saved campaign request draft before submitting it.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <EditCampaignRequestPage />
    </ProfileGate>
  ),
});

function EditCampaignRequestPage() {
  const { requestId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchRequest = useServerFn(getCampaignRequest);
  const updateDraft = useServerFn(updateCampaignRequestDraft);
  const submitRequest = useServerFn(submitCampaignRequest);

  const {
    data: request,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaign-requests", requestId],
    queryFn: () => fetchRequest({ data: { id: requestId } }),
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["campaign-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard", "campaign-requests"] });
  };

  const draftMutation = useMutation({
    mutationFn: (values: CampaignRequestPayload) =>
      updateDraft({ data: { id: requestId, values } }),
    onSuccess: () => {
      toast.success("Draft updated.");
      invalidate();
      void navigate({ to: "/app/business/requests" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitMutation = useMutation({
    mutationFn: (values: CampaignRequestPayload) =>
      submitRequest({ data: { id: requestId, values } }),
    onSuccess: () => {
      toast.success("Request submitted for review.");
      invalidate();
      void navigate({
        to: "/app/business/requests/$requestId",
        params: { requestId },
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const readOnly = request && request.status !== "draft" && request.status !== "changes_requested";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Business"
        title="Edit Campaign Request"
        description="Update your draft, then save it or submit it for review."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={!request}
        empty={<EmptyState title="Request not found" hint="This draft may have been deleted." />}
      >
        {readOnly ? (
          <EmptyState
            icon={<Lock className="size-8" />}
            title="This request is read-only"
            hint="Submitted requests can no longer be edited. Open the request to review its details."
          />
        ) : request && user ? (
          <CampaignRequestForm
            userId={user.id}
            defaultValues={request}
            saving={draftMutation.isPending || submitMutation.isPending}
            onSaveDraft={async (values) => {
              await draftMutation.mutateAsync(values);
            }}
            onSubmitRequest={async (values) => {
              await submitMutation.mutateAsync(values);
            }}
          />
        ) : null}
      </DataSection>
    </div>
  );
}
