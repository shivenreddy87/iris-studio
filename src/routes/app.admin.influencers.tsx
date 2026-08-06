import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/influencers")({
  head: () => ({
    meta: [
      { title: "Influencers — Iris Studio" },
      { name: "description", content: "Directory of influencers registered on the platform." },
      { property: "og:title", content: "Influencers — Iris Studio" },
      { property: "og:description", content: "Directory of influencers registered on the platform." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminInfluencersPage,
});

function AdminInfluencersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Admin" title="Influencers" description="Every influencer account, with their entries and contest wins." />
      <EmptyState
        icon={<Users className="size-8" />}
        title="No influencers yet"
        hint="Influencer accounts appear here as they register."
      />
      <MilestoneNotice
        items={[
          "Influencer directory with search",
          "Entry and win history per influencer",
          "Account status controls",
        ]}
      />
    </div>
  );
}
