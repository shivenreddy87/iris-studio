import { Link } from "@tanstack/react-router";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import {
  CONTEST_ENTRY_STATUS_LABELS,
  type ContestEntry,
  type ContestEntryStatus,
} from "../types";

const TONES: Record<ContestEntryStatus, StatusTone> = {
  applied: "info",
  shortlisted: "warning",
  selected: "active",
  rejected: "danger",
  withdrawn: "neutral",
  submitted: "info",
  won: "success",
};

export function ContestEntryStatusBadge({ status }: { status: ContestEntryStatus }) {
  return <StatusBadge label={CONTEST_ENTRY_STATUS_LABELS[status]} tone={TONES[status]} />;
}

export function ContestEntryList({ entries }: { entries: ContestEntry[] }) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <Link
          key={entry.id}
          to="/app/contests/$contestId"
          params={{ contestId: entry.contestId }}
          className="block rounded-2xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-violet/30"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-display text-base font-semibold text-ink">{entry.contestTitle}</span>
            <ContestEntryStatusBadge status={entry.status} />
          </div>
          {entry.pitch ? <p className="line-clamp-2 text-sm text-ink-dim">{entry.pitch}</p> : null}
        </Link>
      ))}
    </div>
  );
}
