import { CheckCircle2, XCircle } from "lucide-react";
import {
  ELIGIBILITY_REASON_DETAILS,
  ELIGIBILITY_REASON_LABELS,
  type EligibilityResult,
} from "../eligibility";

/** Structured eligibility reasons, reused wherever eligibility is explained. */
export function EligibilityReasonList({
  eligibility,
  className = "",
}: {
  eligibility: EligibilityResult;
  className?: string;
}) {
  return (
    <div className={className}>
      <ul className="space-y-2">
        {eligibility.reasons.map((reason) => (
          <li key={reason} className="flex items-start gap-2 text-sm">
            {eligibility.eligible ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-violet" />
            ) : (
              <XCircle className="mt-0.5 size-4 shrink-0 text-rose" />
            )}
            <span className="min-w-0">
              <span className="font-medium text-ink">{ELIGIBILITY_REASON_LABELS[reason]}</span>
              <span className="block text-ink-dim">{ELIGIBILITY_REASON_DETAILS[reason]}</span>
            </span>
          </li>
        ))}
      </ul>
      {eligibility.missingRequirements.length > 0 ? (
        <div className="mt-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Missing requirements
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-dim">
            {eligibility.missingRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
