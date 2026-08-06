import { createFileRoute } from "@tanstack/react-router";
import { Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/businesses/$businessId")({
  head: () => ({
    meta: [
      { title: "Business — Iris Studio" },
      {
        name: "description",
        content: "Profile, campaign requests and contest history for a single business.",
      },
      { property: "og:title", content: "Business — Iris Studio" },
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
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
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
