import { Panel, DetailRow, dateOr } from "./detail-row";
import { Button } from "@/components/ui/button";
import type { ContestAvailability, EligibilityResult } from "../eligibility";

/**
 * Application summary. Contest Applications land in the next milestone; the
 * layout here is final so it only needs its data wired in.
 */
export function ContestApplicationPanel({
  eligibility,
  availability,
}: {
  eligibility: EligibilityResult;
  availability: ContestAvailability;
}) {
  return (
    <Panel title="Application">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <DetailRow label="Application status" value="Not available" />
        <DetailRow label="Eligibility" value={eligibility.eligible ? "Eligible" : "Not eligible"} />
        <DetailRow label="Applications open" value={dateOr(availability.applicationStartDate)} />
        <DetailRow label="Applications close" value={dateOr(availability.applicationDeadline)} />
      </dl>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" disabled>
          Apply to contest
        </Button>
        <p className="text-sm text-ink-mute">Applications will open in the next milestone.</p>
      </div>
    </Panel>
  );
}
