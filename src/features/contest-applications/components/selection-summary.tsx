import { Panel } from "@/features/contests/components/detail-row";
import { ParticipantLimitIndicator } from "./participant-limit-indicator";
import type { SelectionSummaryData } from "../types";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-ink">{value}</p>
    </div>
  );
}

/** Totals for the participant selection workspace and the business summary. */
export function SelectionSummary({
  summary,
  actions,
}: {
  summary: SelectionSummaryData;
  actions?: React.ReactNode;
}) {
  return (
    <Panel title="Selection summary">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total applications" value={summary.totalApplications} />
        <Stat label="Selected participants" value={summary.selectedCount} />
        <Stat
          label="Remaining slots"
          value={summary.remainingSlots === null ? "No limit" : summary.remainingSlots}
        />
        <Stat
          label="Participant limit"
          value={summary.participantLimit === null ? "Not set" : summary.participantLimit}
        />
      </div>
      <div className="mt-5">
        <ParticipantLimitIndicator
          selected={summary.selectedCount}
          limit={summary.participantLimit}
        />
      </div>
      {actions ? <div className="mt-5 flex flex-wrap gap-3">{actions}</div> : null}
    </Panel>
  );
}
