import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listSubmissionEvents } from "../submission.functions";
import { submissionKeys, useInvalidateSubmissions } from "../hooks/use-submissions";
import type { ParticipantSubmission } from "../types";
import { SubmissionStatusBadge } from "./submission-status-badge";
import { SubmissionDetails } from "./submission-details";
import { SubmissionTimeline } from "./submission-timeline";
import { SubmissionReviewDialog } from "./submission-review-dialog";

function formatFollowers(value: number | null) {
  if (value === null) return "—";
  return value >= 1000 ? `${Math.round(value / 100) / 10}k` : String(value);
}

/** One participant row in the admin submission workspace. */
export function SubmissionCard({ row }: { row: ParticipantSubmission }) {
  const invalidate = useInvalidateSubmissions();
  const fetchEvents = useServerFn(listSubmissionEvents);
  const submission = row.submission;

  const { data: events } = useQuery({
    queryKey: submissionKeys.events(submission?.id ?? "none"),
    queryFn: () => fetchEvents({ data: { submissionId: submission!.id } }),
    enabled: Boolean(submission),
  });

  return (
    <article className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium text-ink">
            {row.influencerName ?? "Influencer"}
          </h3>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            {row.influencerHandle ? `@${row.influencerHandle}` : "No handle"} ·{" "}
            {formatFollowers(row.followers)} followers
            {row.niche ? ` · ${row.niche}` : ""}
          </p>
        </div>
        <SubmissionStatusBadge status={row.status} />
      </header>

      {submission ? (
        <>
          <div className="mt-4">
            <SubmissionDetails submission={submission} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <SubmissionReviewDialog
              submission={submission}
              decision="verified"
              onReviewed={() => invalidate(row.submission?.contestId, submission.id)}
            />
            <SubmissionReviewDialog
              submission={submission}
              decision="flagged"
              onReviewed={() => invalidate(row.submission?.contestId, submission.id)}
            />
          </div>
          <div className="mt-5 border-t border-hairline pt-4">
            <SubmissionTimeline events={events ?? []} />
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-ink-mute">
          This participant has not submitted content yet.
        </p>
      )}
    </article>
  );
}
