import { Check, Circle } from "lucide-react";
import { CAMPAIGN_REQUEST_STATUS_LABELS, type CampaignRequest } from "../types";

function formatWhen(value: string | null) {
  return value
    ? new Date(value).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
}

/** Linear status history for a request: created → submitted → review → decision. */
export function RequestTimeline({ request }: { request: CampaignRequest }) {
  const decided = request.status === "approved" || request.status === "rejected";

  const steps = [
    { key: "draft", label: "Draft created", at: request.createdAt, done: true },
    {
      key: "submitted",
      label: CAMPAIGN_REQUEST_STATUS_LABELS.submitted,
      at: request.submittedAt,
      done: request.status !== "draft" && request.status !== "cancelled",
    },
    {
      key: "under_review",
      label: CAMPAIGN_REQUEST_STATUS_LABELS.under_review,
      at: request.status === "under_review" ? request.updatedAt : null,
      done: request.status === "under_review" || decided,
    },
    {
      key: "decision",
      label: decided ? CAMPAIGN_REQUEST_STATUS_LABELS[request.status] : "Decision",
      at: request.reviewedAt,
      done: decided,
    },
  ];

  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={step.key} className="flex gap-3">
          <span
            className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border ${
              step.done
                ? "border-violet/40 bg-violet/15 text-violet"
                : "border-hairline bg-surface-3 text-ink-mute"
            }`}
          >
            {step.done ? <Check className="size-3" /> : <Circle className="size-2" />}
          </span>
          <div>
            <p className={`text-sm ${step.done ? "text-ink" : "text-ink-mute"}`}>{step.label}</p>
            {formatWhen(step.at) ? (
              <p className="text-xs text-ink-mute">{formatWhen(step.at)}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
