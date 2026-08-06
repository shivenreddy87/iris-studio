import { Check } from "lucide-react";
import { SUBMISSION_EVENT_LABELS, type SubmissionEvent, type SubmissionEventType } from "../types";

function formatWhen(value: string) {
  return new Date(value).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Event-sourced submission history — every row comes from contest_submission_events. */
export function SubmissionTimeline({ events }: { events: SubmissionEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-ink-mute">No submission activity recorded yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event) => (
        <li key={event.id} className="flex gap-3">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-violet/40 bg-violet/10 text-violet">
            <Check className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {SUBMISSION_EVENT_LABELS[event.eventType as SubmissionEventType] ?? event.eventType}
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
