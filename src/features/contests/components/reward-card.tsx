import { Panel, DetailRow, money, numOr } from "./detail-row";
import type { Contest } from "../types";

export function RewardCard({ contest }: { contest: Contest }) {
  const perWinner =
    contest.rewardPool !== null && contest.winnerCount ? contest.rewardPool / contest.winnerCount : null;

  return (
    <Panel title="Rewards">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <DetailRow label="Reward pool" value={money(contest.rewardPool)} />
        <DetailRow label="Winners" value={numOr(contest.winnerCount)} />
        <DetailRow label="Maximum participants" value={numOr(contest.participantLimit)} />
        <DetailRow label="Average per winner" value={money(perWinner)} />
      </dl>
    </Panel>
  );
}
