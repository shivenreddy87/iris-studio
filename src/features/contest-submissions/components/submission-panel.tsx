import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Lock } from "lucide-react";
import { Panel } from "@/features/contests/components/detail-row";
import {
  getContestExecution,
  listSubmissionEvents,
  submitContestContent,
} from "../submission.functions";
import { submissionKeys, useInvalidateSubmissions } from "../hooks/use-submissions";
import type { SubmissionFormValues } from "../submission.schema";
import { ContestSubmissionForm } from "./contest-submission-form";
import { SubmissionStatusBadge } from "./submission-status-badge";
import { SubmissionDetails } from "./submission-details";
import { SubmissionTimeline } from "./submission-timeline";

/** Influencer submission surface on the contest detail page. */
export function SubmissionPanel({ contestId }: { contestId: string }) {
  const invalidate = useInvalidateSubmissions();
  const fetchExecution = useServerFn(getContestExecution);
  const fetchEvents = useServerFn(listSubmissionEvents);
  const submit = useServerFn(submitContestContent);

  const { data, isLoading } = useQuery({
    queryKey: submissionKeys.execution(contestId),
    queryFn: () => fetchExecution({ data: { contestId } }),
  });

  const submission = data?.submission ?? null;

  const { data: events } = useQuery({
    queryKey: submissionKeys.events(submission?.id ?? "none"),
    queryFn: () => fetchEvents({ data: { submissionId: submission!.id } }),
    enabled: Boolean(submission),
  });

  const mutation = useMutation({
    mutationFn: (values: SubmissionFormValues) =>
      submit({
        data: {
          contestId,
          platform: values.platform,
          contentUrl: values.contentUrl,
          caption: values.caption ?? "",
          notes: values.notes ?? "",
        },
      }),
    onSuccess: (created) => {
      toast.success("Content submitted for review");
      invalidate(contestId, created.id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <Panel title="Content submission">
        <p className="text-sm text-ink-mute">Checking your participation…</p>
      </Panel>
    );
  }

  // Not a participant: this contest has no execution surface for them.
  if (!data || !data.participantId) return null;

  if (submission) {
    return (
      <Panel title="Your submission">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SubmissionStatusBadge status={submission.status} />
          <p className="text-xs text-ink-mute">Submissions are final and cannot be edited.</p>
        </div>
        <div className="mt-4">
          <SubmissionDetails submission={submission} />
        </div>
        <div className="mt-6 border-t border-hairline pt-5">
          <SubmissionTimeline events={events ?? []} />
        </div>
      </Panel>
    );
  }

  if (!data.canSubmit) {
    return (
      <Panel title="Content submission">
        <div className="flex items-start gap-3 text-sm text-ink-dim">
          <Lock className="mt-0.5 size-4 shrink-0 text-ink-mute" />
          <p>{data.blockedReason ?? "Submissions are not open for this contest."}</p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="Submit your content">
      <ContestSubmissionForm
        contestPlatform={data.contest?.targetPlatform ?? null}
        submitting={mutation.isPending}
        onSubmit={async (values) => {
          await mutation.mutateAsync(values);
        }}
      />
    </Panel>
  );
}
