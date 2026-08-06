import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileCheck2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import {
  createContestFromRequest,
  listApprovedRequestsWithoutContest,
} from "@/features/contests/contest.functions";
import { contestKeys, useInvalidateContest } from "@/features/contests/hooks/use-contests";
import { dateOr, money, numOr } from "@/features/contests/components/detail-row";
import type { ContestSource } from "@/features/contests/types";

export const Route = createFileRoute("/app/admin/contests/new")({
  head: () => ({
    meta: [
      { title: "New Contest — Project Eros" },
      { name: "description", content: "Create a contest from an approved campaign request." },
      { property: "og:title", content: "New Contest — Project Eros" },
      {
        property: "og:description",
        content: "Create a contest from an approved campaign request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminNewContestPage,
});

function AdminNewContestPage() {
  const fetchSources = useServerFn(listApprovedRequestsWithoutContest);
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({ queryKey: contestKeys.sources, queryFn: () => fetchSources() });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="New Contest"
        description="Pick an approved campaign request to turn into a contest draft."
      />
      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={data.length === 0}
        empty={
          <EmptyState
            icon={<FileCheck2 className="size-8" />}
            title="No approved requests waiting"
            hint="Approve a campaign request first — every contest starts from one."
          />
        }
      >
        <div className="grid gap-3">
          {data.map((source) => (
            <SourceRow key={source.id} source={source} />
          ))}
        </div>
      </DataSection>
    </div>
  );
}

function SourceRow({ source }: { source: ContestSource }) {
  const navigate = useNavigate();
  const invalidate = useInvalidateContest();
  const createFn = useServerFn(createContestFromRequest);

  const create = useMutation({
    mutationFn: () => createFn({ data: { campaignRequestId: source.id } }),
    onSuccess: (contest) => {
      toast.success("Contest draft created");
      invalidate(contest.id);
      void navigate({
        to: "/app/admin/contests/$contestId/edit",
        params: { contestId: contest.id },
      });
    },
    onError: (mutationError: Error) => toast.error(mutationError.message),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-hairline bg-surface-2 p-5">
      <div>
        <p className="font-display text-base font-semibold text-ink">{source.title}</p>
        <p className="text-sm text-ink-dim">
          {source.businessName ?? "Business"}
          {source.approvalReference ? ` · ${source.approvalReference}` : ""}
        </p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Budget {money(source.budget)} · Views {numOr(source.requiredViews)} · Approved{" "}
          {dateOr(source.approvedAt)}
        </p>
      </div>
      <Button disabled={create.isPending} onClick={() => create.mutate()}>
        Create contest draft
      </Button>
    </div>
  );
}
