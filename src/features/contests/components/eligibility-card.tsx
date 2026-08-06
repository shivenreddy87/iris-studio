import { Panel, DetailRow, dash, numOr } from "./detail-row";
import type { Contest } from "../types";

export function EligibilityCard({ contest }: { contest: Contest }) {
  return (
    <Panel title="Eligibility">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <DetailRow label="Creator category" value={dash(contest.preferredCreatorCategory)} />
        <DetailRow label="Platform" value={dash(contest.targetPlatform)} />
        <DetailRow label="Location" value={dash(contest.targetLocation)} />
        <DetailRow label="Minimum followers" value={numOr(contest.minimumFollowers)} />
        <DetailRow label="Maximum followers" value={numOr(contest.maximumFollowers)} />
        <DetailRow label="Required views" value={numOr(contest.requiredViews)} />
      </dl>
    </Panel>
  );
}
