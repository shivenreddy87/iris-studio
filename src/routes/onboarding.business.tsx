import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { BusinessProfileForm } from "@/features/profiles/components/business-profile-form";
import {
  getMyProfile,
  upsertBusinessProfile,
  completeOnboarding,
} from "@/features/profiles/profiles.functions";

export const Route = createFileRoute("/onboarding/business")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/sign-in" });
  },
  head: () => ({
    meta: [
      { title: "Business profile setup — Project Eros" },
      {
        name: "description",
        content: "Set up your business profile so our team can match you with the right contests.",
      },
      { property: "og:title", content: "Business profile setup — Project Eros" },
      {
        property: "og:description",
        content: "Set up your business profile so our team can match you with the right contests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BusinessOnboarding,
});

function BusinessOnboarding() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(upsertBusinessProfile);
  const finishOnboarding = useServerFn(completeOnboarding);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <ListSkeleton rows={4} />
      </div>
    );
  }

  if (profile.onboardingCompletedAt) {
    void navigate({ to: "/app" });
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-1">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8">
        <PageHeader
          eyebrow="Step 1 of 1"
          title="Set up your business profile"
          description="This is what our team uses to review your campaign requests and build contests for you. You can edit everything later."
        />
        <BusinessProfileForm
          userId={profile.userId}
          defaultValues={profile.business}
          submitLabel="Finish setup"
          onSubmit={async (values) => {
            try {
              await saveProfile({ data: values });
              await finishOnboarding();
              toast.success("Business profile saved.");
              await navigate({ to: "/app" });
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Could not save your profile.");
            }
          }}
        />
      </div>
    </div>
  );
}
