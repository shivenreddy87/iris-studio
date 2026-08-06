import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ContestExecution } from "../types";
import { SubmissionStatusBadge } from "./submission-status-badge";

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";
}

/** Influencer view of the contests they are executing, with submission state per contest. */
export function ExecutionList({ executions }: { executions: ContestExecution[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {executions.map(({ contest, submission, submissionStatus, canSubmit }) => (
        <article
          key={contest.id}
          className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface-2 p-5"
        >
          <div>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-medium text-ink">{contest.title}</h3>
              <SubmissionStatusBadge status={submissionStatus} />
            </div>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              Ends {formatDate(contest.contestEndDate)}
            </p>
            <p className="mt-3 line-clamp-2 text-sm text-ink-dim">{contest.description ?? ""}</p>
          </div>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-xs text-ink-mute">
              {submission
                ? `Submitted ${formatDate(submission.submittedAt)}`
                : canSubmit
                  ? "Awaiting your submission"
                  : "Submissions closed"}
            </p>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/app/contests/$contestId" params={{ contestId: contest.id }}>
                {canSubmit ? "Submit content" : "View"}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
