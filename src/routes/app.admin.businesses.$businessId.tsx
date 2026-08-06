import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/businesses/$businessId")({
  head: () => ({
    meta: [
      { title: "Business — Project Eros" },
      {
        name: "description",
        content: "Profile, campaign requests and contest history for a single business.",
      },
      { property: "og:title", content: "Business — Project Eros" },
      {
        property: "og:description",
        content: "Profile, campaign requests and contest history for a single business.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBusinessDetailPage,
});

function AdminBusinessDetailPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Business"
        description="Profile details, submitted requests and the contests created for this business."
      />
      <EmptyState
        icon={<Building2 className="size-8" />}
        title="Business details unavailable"
        hint="Business records land in the next milestone; this page is already wired to its final URL."
      />
    </div>
  );
}
