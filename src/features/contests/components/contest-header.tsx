import type { ReactNode } from "react";
import { ContestStatusBadge } from "./contest-status-badge";
import { dateOr } from "./detail-row";
import type { Contest } from "../types";

export function ContestHeader({ contest, actions }: { contest: Contest; actions?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            {contest.businessName ?? "Business"}
            {contest.approvalReference ? ` · ${contest.approvalReference}` : ""}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{contest.title}</h2>
          <p className="mt-1 text-sm text-ink-mute">
            Created {dateOr(contest.createdAt)}
            {contest.publishedAt ? ` · Published ${dateOr(contest.publishedAt)}` : ""}
            {contest.archivedAt ? ` · Archived ${dateOr(contest.archivedAt)}` : ""}
          </p>
        </div>
        <ContestStatusBadge status={contest.status} />
      </div>
      {actions ? <div className="mt-5">{actions}</div> : null}
    </div>
  );
}
