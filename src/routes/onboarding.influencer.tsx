import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/shared/page-header";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { InfluencerProfileForm } from "@/features/profiles/components/influencer-profile-form";
import {
  getMyProfile,
  upsertInfluencerProfile,
  completeOnboarding,
} from "@/features/profiles/profiles.functions";

export const Route = createFileRoute("/onboarding/influencer")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth/sign-in" });
  },
  head: () => ({
    meta: [
      { title: "Influencer profile setup — Project Eros" },
      {
        name: "description",
        content: "Set up your influencer profile so our team can match you with the right contests.",
      },
      { property: "og:title", content: "Influencer profile setup — Project Eros" },
      {
        property: "og:description",
        content:
          "Set up your influencer profile so our team can match you with the right contests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InfluencerOnboarding,
});

function InfluencerOnboarding() {
  const navigate = useNavigate();
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(upsertInfluencerProfile);
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
          title="Set up your influencer profile"
          description="This is what our team reviews when selecting participants and winners for contests. You can edit everything later."
        />
        <InfluencerProfileForm
          userId={profile.userId}
          defaultValues={profile.influencer}
          submitLabel="Finish setup"
          onSubmit={async (values) => {
            try {
              await saveProfile({ data: values });
              await finishOnboarding();
              toast.success("Influencer profile saved.");
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
