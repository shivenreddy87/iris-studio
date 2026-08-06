import type { ReactNode } from "react";
import { ContestStatusBadge } from "./contest-status-badge";
import { dateOr } from "./detail-row";
import type { ContestAvailability } from "../eligibility";
import type { Contest } from "../types";

/** Header for the influencer-facing contest detail page. */
export function ContestDetailHeader({
  contest,
  availability,
  actions,
}: {
  contest: Contest;
  availability: ContestAvailability;
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            {contest.businessCategory ?? "Contest"}
            {contest.targetPlatform ? ` · ${contest.targetPlatform}` : ""}
          </p>
          <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{contest.title}</h2>
          <p className="mt-1 text-sm text-ink-mute">
            {availability.label}
            {contest.applicationDeadline ? ` · Closes ${dateOr(contest.applicationDeadline)}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ContestStatusBadge status={contest.status} />
          {actions}
        </div>
      </div>
    </div>
  );
}
