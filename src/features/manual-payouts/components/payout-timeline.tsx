import { Check, Lock } from "lucide-react";
import { humaniseEventType, type PayoutEvent } from "../types";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Immutable audit trail for a single payout. */
export function PayoutTimeline({
  events,
  emptyHint = "No payout activity yet.",
}: {
  events: PayoutEvent[];
  emptyHint?: string;
}) {
  if (events.length === 0) return <p className="text-sm text-ink-mute">{emptyHint}</p>;

  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const internal = event.eventType === "internal_note_added";
        return (
          <li key={event.id} className="flex gap-3">
            <span
              className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${
                internal
                  ? "border-hairline bg-surface-3 text-ink-mute"
                  : "border-violet/40 bg-violet/15 text-violet"
              }`}
            >
              {internal ? <Lock className="size-3" /> : <Check className="size-3" />}
            </span>
            <div className="min-w-0">
              <p className="text-sm text-ink">{humaniseEventType(event.eventType)}</p>
              <p className="text-xs text-ink-mute">
                {formatWhen(event.createdAt)}
                {event.actorName ? ` · ${event.actorName}` : ""}
              </p>
              {event.note ? (
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink-dim">{event.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
