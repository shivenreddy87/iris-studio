import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { listMyContestExecutions } from "@/features/contest-submissions/submission.functions";
import { submissionKeys } from "@/features/contest-submissions/hooks/use-submissions";
import { ExecutionList } from "@/features/contest-submissions/components/execution-list";
import { ProfileGate } from "@/features/profiles/components/profile-gate";

export const Route = createFileRoute("/app/contests/completed")({
  head: () => ({
    meta: [
      { title: "Completed Contests — Project Eros" },
      { name: "description", content: "Your history of finished contests and their results." },
      { property: "og:title", content: "Completed Contests — Project Eros" },
      {
        property: "og:description",
        content: "Your history of finished contests and their results.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <CompletedContestsPage />
    </ProfileGate>
  ),
});

function CompletedContestsPage() {
  const fetchItems = useServerFn(listMyContestExecutions);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: submissionKeys.executions("completed"),
    queryFn: () => fetchItems({ data: { scope: "completed" as const } }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Influencer"
        title="Completed Contests"
        description="Every contest you participated in that has finished, with your submission outcome."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<ListChecks className="size-8" />}
            title="No completed contests yet"
            hint="Finished contests move here automatically with their outcome."
          />
        }
      >
        <ExecutionList executions={data} />
      </DataSection>
    </div>
  );
}
