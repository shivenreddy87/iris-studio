import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { useAuth } from "@/hooks/use-auth";
import {
  createCampaignRequestDraft,
  submitCampaignRequest,
} from "@/features/campaign-requests/requests.functions";
import {
  CampaignRequestForm,
  type CampaignRequestPayload,
} from "@/features/campaign-requests/components/campaign-request-form";
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createDraft = useServerFn(createCampaignRequestDraft);
  const submitRequest = useServerFn(submitCampaignRequest);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["campaign-requests"] });
    void queryClient.invalidateQueries({ queryKey: ["dashboard", "campaign-requests"] });
  };

  const draftMutation = useMutation({
    mutationFn: (values: CampaignRequestPayload) => createDraft({ data: values }),
    onSuccess: () => {
      toast.success("Draft saved.");
      invalidate();
      void navigate({ to: "/app/business/requests" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitMutation = useMutation({
    mutationFn: (values: CampaignRequestPayload) => submitRequest({ data: { values } }),
    onSuccess: () => {
      toast.success("Request submitted for review.");
      invalidate();
      void navigate({ to: "/app/business/requests" });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Business"
        title="New Campaign Request"
        description="Describe the campaign you want to run. Our team reviews every brief before creating a contest."
      />
      {user ? (
        <CampaignRequestForm
          userId={user.id}
          saving={draftMutation.isPending || submitMutation.isPending}
          onSaveDraft={async (values) => {
            await draftMutation.mutateAsync(values);
          }}
          onSubmitRequest={async (values) => {
            await submitMutation.mutateAsync(values);
          }}
        />
      ) : (
        <ListSkeleton rows={4} />
      )}
    </div>
  );
}
