import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/businesses")({
  head: () => ({
    meta: [
      { title: "Businesses — Iris Studio" },
      { name: "description", content: "Directory of the businesses registered on the platform." },
      { property: "og:title", content: "Businesses — Iris Studio" },
      {
        property: "og:description",
        content: "Directory of the businesses registered on the platform.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBusinessesPage,
});

function AdminBusinessesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Businesses"
        description="Every business account, its campaign requests and contest history."
      />
      <EmptyState
        icon={<Building2 className="size-8" />}
        title="No businesses yet"
        hint="Business accounts appear here as they register."
      />
      <MilestoneNotice
        items={[
          "Business directory with search",
          "Request and contest history per business",
          "Account status controls",
        ]}
      />
    </div>
  );
}
