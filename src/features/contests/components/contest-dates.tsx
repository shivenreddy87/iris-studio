import { Panel, DetailRow, dateOr } from "./detail-row";
import type { Contest } from "../types";

export function ContestDates({ contest }: { contest: Contest }) {
  return (
    <Panel title="Contest dates">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <DetailRow label="Applications open" value={dateOr(contest.applicationStartDate)} />
        <DetailRow label="Applications close" value={dateOr(contest.applicationDeadline)} />
        <DetailRow label="Contest starts" value={dateOr(contest.contestStartDate)} />
        <DetailRow label="Contest ends" value={dateOr(contest.contestEndDate)} />
      </dl>
    </Panel>
  );
}
