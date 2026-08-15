import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { SocialAccountsPanel } from "@/features/social-verification/components/social-accounts-panel";

export const Route = createFileRoute("/app/settings/social")({
  head: () => ({
    meta: [
      { title: "Social accounts — Creoinfo" },
      {
        name: "description",
        content:
          "Connect your Instagram account, set a primary platform and track verification status on Creoinfo.",
      },
      { property: "og:title", content: "Social accounts — Creoinfo" },
      {
        property: "og:description",
        content:
          "Connect your Instagram account, set a primary platform and track verification status on Creoinfo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SocialSettingsPage,
});

function SocialSettingsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <Link
        to="/app/settings"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="size-4" /> Settings
      </Link>
      <PageHeader
        eyebrow="Settings"
        title="Social accounts"
        description="Link the account you publish from, mark it primary and keep track of its verification status."
      />
      <div className="mt-6">
        <SocialAccountsPanel />
      </div>
    </div>
  );
}
