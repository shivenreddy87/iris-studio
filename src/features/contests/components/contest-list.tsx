import { Link } from "@tanstack/react-router";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { CONTEST_STATUS_LABELS, type Contest, type ContestStatus } from "../types";

const TONES: Record<ContestStatus, StatusTone> = {
  draft: "neutral",
  open: "info",
  selecting: "warning",
  active: "active",
  judging: "warning",
  completed: "success",
  cancelled: "danger",
};

export function ContestStatusBadge({ status }: { status: ContestStatus }) {
  return <StatusBadge label={CONTEST_STATUS_LABELS[status]} tone={TONES[status]} />;
}

export function ContestList({ contests }: { contests: Contest[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {contests.map((contest) => (
        <Link
          key={contest.id}
          to="/app/contests/$contestId"
          params={{ contestId: contest.id }}
          className="block rounded-3xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-violet/30"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-display text-base font-semibold text-ink">{contest.title}</span>
            <ContestStatusBadge status={contest.status} />
          </div>
          {contest.description ? (
            <p className="line-clamp-2 text-sm text-ink-dim">{contest.description}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
