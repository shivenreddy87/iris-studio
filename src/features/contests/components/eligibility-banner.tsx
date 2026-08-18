import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { EligibilityReasonList } from "./eligibility-reason-list";
import type { ContestAvailability, EligibilityResult } from "../eligibility";

/**
 * Single banner that explains where the influencer stands: eligible and waiting
 * for applications, or ineligible with structured reasons.
 */
export function EligibilityBanner({
  eligibility,
  availability,
}: {
  eligibility: EligibilityResult;
  availability: ContestAvailability;
}) {
  if (!eligibility.eligible) {
    return (
      <div className="rounded-3xl border border-rose/40 bg-rose/10 p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose" />
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-ink">
              You are not eligible for this contest
            </p>
            <p className="mt-1 text-sm text-ink-dim">
              Update your profile to match the requirements below and check back.
            </p>
            <EligibilityReasonList eligibility={eligibility} className="mt-4" />
          </div>
        </div>
      </div>
    );
  }

  const opening = availability.state === "open" || availability.state === "not_yet_open";

  return (
    <div className="rounded-3xl border border-violet/40 bg-violet/10 p-6">
      <div className="flex items-start gap-3">
        {opening ? (
          <Clock className="mt-0.5 size-5 shrink-0 text-violet" />
        ) : (
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-violet" />
        )}
        <div>
          <p className="font-display text-base font-semibold text-ink">
            {opening ? "Applications opening soon" : availability.label}
          </p>
          <p className="mt-1 text-sm text-ink-dim">
            You meet every requirement for this contest. Applications have not opened yet — we will
            notify you the moment entries go live.
          </p>

        </div>
      </div>
    </div>
  );
}
