import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/influencers/$influencerId")({
  head: () => ({
    meta: [
      { title: "Influencer — Creoinfo" },
      {
        name: "description",
        content: "Profile, contest entries and wins for a single influencer.",
      },
      { property: "og:title", content: "Influencer — Creoinfo" },
      {
        property: "og:description",
        content: "Profile, contest entries and wins for a single influencer.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminInfluencerDetailPage,
});

function AdminInfluencerDetailPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Influencer"
        description="Profile details, applications, participation and wins for this influencer."
      />
      <EmptyState
        icon={<Users className="size-8" />}
        title="Influencer details unavailable"
        hint="Influencer records land in the next milestone; this page is already wired to its final URL."
      />
    </div>
  );
}
