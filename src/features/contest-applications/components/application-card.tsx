import { Link } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { ApplicationStatusBadge } from "./application-status-badge";
import { dateOr } from "@/features/contests/components/detail-row";
import type { ContestApplication } from "../types";

/** Influencer-facing summary of one submitted application. */
export function ApplicationCard({
  application,
  action,
}: {
  application: ContestApplication;
  action?: React.ReactNode;
}) {
  return (
    <article className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/app/contests/$contestId"
            params={{ contestId: application.contestId }}
            className="font-display text-lg font-semibold text-ink hover:text-violet"
          >
            {application.contestTitle}
          </Link>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Applied {dateOr(application.submittedAt)}
            {application.applicationDeadline
              ? ` · Closes ${dateOr(application.applicationDeadline)}`
              : ""}
          </p>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>

      <p className="mt-4 line-clamp-3 text-sm text-ink-dim">{application.contentIdea}</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={application.portfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-violet hover:underline"
        >
          Portfolio <ExternalLink className="size-3.5" />
        </a>
        {action}
      </div>
    </article>
  );
}

/** Admin-facing row: shows who applied. */
export function ApplicantRow({ application }: { application: ContestApplication }) {
  return (
    <article className="rounded-2xl border border-hairline bg-surface-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {application.influencerName ?? "Influencer"}
            {application.influencerHandle ? (
              <span className="ml-2 text-ink-mute">@{application.influencerHandle}</span>
            ) : null}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Applied {dateOr(application.submittedAt)}
          </p>
        </div>
        <ApplicationStatusBadge status={application.status} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm text-ink-dim">{application.contentIdea}</p>
      {application.notes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-mute">{application.notes}</p>
      ) : null}
      <a
        href={application.portfolioUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet hover:underline"
      >
        Portfolio <ExternalLink className="size-3.5" />
      </a>
    </article>
  );
}
