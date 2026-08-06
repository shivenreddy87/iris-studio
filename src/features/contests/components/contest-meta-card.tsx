import { Panel, DetailRow, dash, dateOr, money, numOr } from "./detail-row";
import type { Contest } from "../types";

/** Compact key-facts card used on discovery detail surfaces. */
export function ContestMetaCard({ contest }: { contest: Contest }) {
  const range =
    contest.minimumFollowers === null && contest.maximumFollowers === null
      ? "Any follower count"
      : `${numOr(contest.minimumFollowers)} – ${
          contest.maximumFollowers === null ? "no cap" : numOr(contest.maximumFollowers)
        }`;

  return (
    <Panel title="Contest at a glance">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <DetailRow label="Business category" value={dash(contest.businessCategory)} />
        <DetailRow label="Campaign goal" value={dash(contest.campaignGoal)} />
        <DetailRow label="Platform" value={dash(contest.targetPlatform)} />
        <DetailRow label="Creator category" value={dash(contest.preferredCreatorCategory)} />
        <DetailRow label="Follower range" value={range} />
        <DetailRow label="Location" value={dash(contest.targetLocation)} />
        <DetailRow label="Reward pool" value={money(contest.rewardPool)} />
        <DetailRow label="Required views" value={numOr(contest.requiredViews)} />
        <DetailRow label="Participant limit" value={numOr(contest.participantLimit)} />
        <DetailRow label="Winners" value={numOr(contest.winnerCount)} />
        <DetailRow label="Contest starts" value={dateOr(contest.contestStartDate)} />
        <DetailRow label="Applications close" value={dateOr(contest.applicationDeadline)} />
      </dl>
    </Panel>
  );
}
