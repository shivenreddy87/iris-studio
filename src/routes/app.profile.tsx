import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ListSkeleton } from "@/components/ui/list-skeleton";
import { ProfileCompletionCard } from "@/features/profiles/components/profile-completion-card";
import { BusinessProfileForm } from "@/features/profiles/components/business-profile-form";
import { InfluencerProfileForm } from "@/features/profiles/components/influencer-profile-form";
import { profileCompletion } from "@/features/profiles/completion";
import {
  getMyProfile,
  upsertBusinessProfile,
  upsertInfluencerProfile,
} from "@/features/profiles/profiles.functions";
import type { BusinessProfile, InfluencerProfile } from "@/features/profiles/types";
import { roleLabel } from "@/lib/roles";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Project Eros" },
      {
        name: "description",
        content: "Manage your account details and how you appear on the platform.",
      },
      { property: "og:title", content: "Profile — Project Eros" },
      {
        property: "og:description",
        content: "Manage your account details and how you appear on the platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const queryClient = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const saveBusiness = useServerFn(upsertBusinessProfile);
  const saveInfluencer = useServerFn(upsertInfluencerProfile);
  const [editing, setEditing] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });

  if (isLoading || !profile) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
        <ListSkeleton rows={4} />
      </div>
    );
  }

  const completion = profileCompletion(profile);
  const isBusiness = profile.role === "brand";
  const isInfluencer = profile.role === "creator";

  async function handleSaved() {
    setEditing(false);
    await queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    toast.success("Profile updated.");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow={roleLabel(profile.role)}
        title="Profile"
        description="Your account details and the information shown to the Project Eros team."
        actions={
          isBusiness || isInfluencer ? (
            <Button variant={editing ? "outline" : "default"} onClick={() => setEditing(!editing)}>
              {editing ? "Cancel" : "Edit information"}
            </Button>
          ) : undefined
        }
      />

      {isBusiness || isInfluencer ? (
        <div className="space-y-6">
          <ProfileCompletionCard completion={completion} showAction={false} />

          {editing ? (
            isBusiness ? (
              <BusinessProfileForm
                userId={profile.userId}
                defaultValues={profile.business}
                submitLabel="Save changes"
                onSubmit={async (values) => {
                  try {
                    await saveBusiness({ data: values });
                    await handleSaved();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not save changes.");
                  }
                }}
              />
            ) : (
              <InfluencerProfileForm
                userId={profile.userId}
                defaultValues={profile.influencer}
                submitLabel="Save changes"
                onSubmit={async (values) => {
                  try {
                    await saveInfluencer({ data: values });
                    await handleSaved();
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not save changes.");
                  }
                }}
              />
            )
          ) : isBusiness ? (
            <BusinessSummary profile={profile.business} email={profile.email} />
          ) : (
            <InfluencerSummary profile={profile.influencer} email={profile.email} />
          )}
        </div>
      ) : (
        <EmptyState
          icon={<UserCircle className="size-8" />}
          title="Admin accounts have no public profile"
          hint="Admin details are managed by the Project Eros team."
        />
      )}
    </div>
  );
}

function DetailGrid({ rows }: { rows: Array<[string, string | null | undefined]> }) {
  return (
    <div className="grid gap-5 rounded-3xl border border-hairline bg-surface-2 p-6 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label}>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-mute">{label}</p>
          <p className="mt-1 text-sm text-ink">{value?.trim() ? value : "—"}</p>
        </div>
      ))}
    </div>
  );
}

function BusinessSummary({
  profile,
  email,
}: {
  profile: BusinessProfile | null;
  email: string | null;
}) {
  return (
    <DetailGrid
      rows={[
        ["Business name", profile?.businessName],
        ["Category", profile?.category],
        ["Contact person", profile?.contactPerson],
        ["Business email", profile?.contactEmail ?? email],
        ["Phone", profile?.phone],
        ["Location", profile?.location],
        ["Website", profile?.website],
        ["Instagram", profile?.instagram],
        ["Description", profile?.description],
      ]}
    />
  );
}

function InfluencerSummary({
  profile,
  email,
}: {
  profile: InfluencerProfile | null;
  email: string | null;
}) {
  return (
    <DetailGrid
      rows={[
        ["Full name", profile?.fullName],
        ["Username", profile?.username],
        ["Account email", email],
        ["Primary category", profile?.category],
        ["Location", profile?.location],
        ["Primary platform", profile?.primaryPlatform],
        ["Follower range", profile?.followerRange],
        ["Instagram", profile?.instagramHandle],
        ["TikTok", profile?.tiktokHandle],
        ["YouTube", profile?.youtubeChannel],
        ["Bio", profile?.bio],
      ]}
    />
  );
}
