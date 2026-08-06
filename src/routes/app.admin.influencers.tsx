import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/influencers")({
  head: () => ({
    meta: [
      { title: "Influencers — Project Eros" },
      { name: "description", content: "Directory of influencers registered on the platform." },
      { property: "og:title", content: "Influencers — Project Eros" },
      {
        property: "og:description",
        content: "Directory of influencers registered on the platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminInfluencersPage,
});

function AdminInfluencersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Influencers"
        description="Every influencer account, with their entries and contest wins."
      />
      <EmptyState
        icon={<Users className="size-8" />}
        title="No influencers yet"
        hint="Influencer accounts appear here as they register."
      />
    </div>
  );
}
