import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyContestExecutions } from "@/features/contest-submissions/submission.functions";
import { submissionKeys } from "@/features/contest-submissions/hooks/use-submissions";
import { ExecutionList } from "@/features/contest-submissions/components/execution-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/contests/active")({
  head: () => ({
    meta: [
      { title: "Active Contests — Iris Studio" },
      { name: "description", content: "Track the contests you are currently participating in." },
      { property: "og:title", content: "Active Contests — Iris Studio" },
      {
        property: "og:description",
        content: "Track the contests you are currently participating in.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <ActiveContestsPage />
    </ProfileGate>
  ),
});

function ActiveContestsPage() {
  const fetchItems = useServerFn(listMyContestExecutions);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: submissionKeys.executions("active"),
    queryFn: () => fetchItems({ data: { scope: "active" as const } }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Active Contests"
        description="Contests you were selected for that are currently running. Publish your content, then submit it for verification."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<PlayCircle className="size-8" />}
            title="No active contests"
            hint="Once you are selected for a contest it will show up here for the duration of the run."
          />
        }
      >
        <ExecutionList executions={data} />
      </DataSection>
    </div>
  );
}
