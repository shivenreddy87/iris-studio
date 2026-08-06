import { Check, Circle, Lock } from "lucide-react";
import { REQUEST_EVENT_LABELS, type CampaignRequestEvent } from "../types";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Event-sourced review history: draft → submitted → review → decision → resubmission. */
export function ReviewTimeline({
  events,
  emptyHint = "No activity recorded yet.",
}: {
  events: CampaignRequestEvent[];
  emptyHint?: string;
}) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-mute">{emptyHint}</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${
              event.internal
                ? "border-hairline bg-surface-3 text-ink-mute"
                : "border-violet/40 bg-violet/15 text-violet"
            }`}
          >
            {event.internal ? <Lock className="size-3" /> : <Check className="size-3" />}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-ink">{REQUEST_EVENT_LABELS[event.kind]}</p>
            <p className="text-xs text-ink-mute">
              {formatWhen(event.createdAt)}
              {event.actorName ? ` · ${event.actorName}` : ""}
            </p>
            {event.note ? (
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-dim">{event.note}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Compact status history used in list/side contexts. */
export function StatusHistory({ events }: { events: CampaignRequestEvent[] }) {
  const visible = events.filter((event) => !event.internal);
  if (visible.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-mute">
        <Circle className="size-2" /> No status changes yet.
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {visible.map((event) => (
        <li key={event.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="text-ink">{REQUEST_EVENT_LABELS[event.kind]}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            {formatWhen(event.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  );
}
