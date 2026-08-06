import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/contests/new")({
  head: () => ({
    meta: [
      { title: "New Contest — Iris Studio" },
      { name: "description", content: "Create a contest from an approved campaign request." },
      { property: "og:title", content: "New Contest — Iris Studio" },
      { property: "og:description", content: "Create a contest from an approved campaign request." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNewContestPage,
});

function AdminNewContestPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Admin" title="New Contest" description="Set the brief, rules, duration, reward and participant cap for a new contest." />
      <EmptyState
        icon={<Trophy className="size-8" />}
        title="Contest builder arriving shortly"
        hint="The builder is being finalised so every field maps to the contest lifecycle."
      />
      <MilestoneNotice
        items={[
          "Pre-fill from an approved campaign request",
          "Entry deadline and run duration",
          "Reward and participant cap",
        ]}
      />
    </div>
  );
}
