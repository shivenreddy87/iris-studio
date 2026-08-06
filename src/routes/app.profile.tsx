import { createFileRoute } from "@tanstack/react-router";
import { UserCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Iris Studio" },
      {
        name: "description",
        content: "Manage your account details and how you appear on the platform.",
      },
      { property: "og:title", content: "Profile — Iris Studio" },
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
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Workspace"
        title="Profile"
        description="Your account details and the information shown to the Iris Studio team."
      />
      <EmptyState
        icon={<UserCircle className="size-8" />}
        title="Profile editing arriving shortly"
        hint="Account details and role-specific profile fields land in the next milestone."
      />
      <MilestoneNotice
        items={[
          "Editable name, avatar and contact details",
          "Role-specific profile fields",
          "Account security settings",
        ]}
      />
    </div>
  );
}
