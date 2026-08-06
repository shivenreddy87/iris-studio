import { ExternalLink } from "lucide-react";
import { SUBMISSION_PLATFORM_LABELS, type ContestSubmission, type SubmissionPlatform } from "../types";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function platformLabel(platform: string) {
  return SUBMISSION_PLATFORM_LABELS[platform as SubmissionPlatform] ?? platform;
}

/** Read-only view of a submitted piece of content. Shared by influencer and admin surfaces. */
export function SubmissionDetails({ submission }: { submission: ContestSubmission }) {
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Platform</dt>
        <dd className="mt-1 text-ink-dim">{platformLabel(submission.platform)}</dd>
      </div>
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Content URL
        </dt>
        <dd className="mt-1">
          <a
            href={submission.contentUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 break-all text-violet hover:underline"
          >
            {submission.contentUrl}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        </dd>
      </div>
      {submission.caption ? (
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Caption</dt>
          <dd className="mt-1 whitespace-pre-wrap text-ink-dim">{submission.caption}</dd>
        </div>
      ) : null}
      {submission.notes ? (
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">Notes</dt>
          <dd className="mt-1 whitespace-pre-wrap text-ink-dim">{submission.notes}</dd>
        </div>
      ) : null}
      <div>
        <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Submitted
        </dt>
        <dd className="mt-1 text-ink-dim">{formatWhen(submission.submittedAt)}</dd>
      </div>
      {submission.reviewedAt ? (
        <div>
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Reviewed
          </dt>
          <dd className="mt-1 text-ink-dim">{formatWhen(submission.reviewedAt)}</dd>
        </div>
      ) : null}
    </dl>
  );
}
