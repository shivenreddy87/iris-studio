import { Trophy } from "lucide-react";
import { RESULT_EVENT_LABELS, type ResultEvent, type ResultEventType } from "../types";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Event-sourced results history — every row comes from contest_result_events. */
export function WinnerTimeline({ events }: { events: ResultEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-mute">No result activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-violet/40 bg-violet/10 text-violet">
            <Trophy className="size-3" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {RESULT_EVENT_LABELS[event.eventType as ResultEventType] ?? event.eventType}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
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
