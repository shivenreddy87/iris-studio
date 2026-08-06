import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MilestoneNotice } from "@/components/shared/milestone-notice";
import { EmptyState } from "@/components/ui/list-skeleton";

export const Route = createFileRoute("/app/admin/contests/$contestId")({
  head: () => ({
    meta: [
      { title: "Manage Contest — Iris Studio" },
      { name: "description", content: "Manage participants, timeline and winners for a single contest." },
      { property: "og:title", content: "Manage Contest — Iris Studio" },
      { property: "og:description", content: "Manage participants, timeline and winners for a single contest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContestDetailPage,
});

function AdminContestDetailPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <PageHeader eyebrow="Admin" title="Manage Contest" description="Entries, selected participants, timeline and winner declaration for this contest." />
      <EmptyState
        icon={<Trophy className="size-8" />}
        title="Contest details unavailable"
        hint="Contest records land in the next milestone; this page is already wired to its final URL."
      />
      <MilestoneNotice
        items={[
          "Select participants from entries",
          "Start, extend or close the contest",
          "Declare winners and notify them",
        ]}
      />
    </div>
  );
}
