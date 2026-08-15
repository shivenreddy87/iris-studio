import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Panel, DetailRow, money, numOr } from "./detail-row";
import { getContestRewardTiers } from "@/features/rewards/rewards.functions";
import { rewardTierKeys } from "@/features/rewards/components/reward-tier-editor";
import { RewardTierTable } from "@/features/rewards/components/reward-tier-table";
import type { Contest } from "../types";

export function RewardCard({ contest }: { contest: Contest }) {
  const fetchTiers = useServerFn(getContestRewardTiers);
  const { data: tiers } = useQuery({
    queryKey: rewardTierKeys.list(contest.id),
    queryFn: () => fetchTiers({ data: { contestId: contest.id } }),
  });

  const perWinner =
    contest.rewardPool !== null && contest.winnerCount
      ? contest.rewardPool / contest.winnerCount
      : null;

  return (
    <Panel title="Rewards">
      <dl className="grid gap-x-8 sm:grid-cols-2">
        <DetailRow label="Reward budget" value={money(contest.rewardPool)} />
        <DetailRow label="Winners" value={numOr(contest.winnerCount)} />
        <DetailRow label="Maximum participants" value={numOr(contest.participantLimit)} />
        <DetailRow label="Indicative per winner" value={money(perWinner)} />
      </dl>

      <div className="mt-6 border-t border-hairline pt-5">
        <h4 className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Performance reward tiers
        </h4>
        <p className="mt-2 text-xs text-ink-mute">
          Rewards are earned from verified views, not paid as a fixed prize. Amounts are confirmed
          only after the platform verifies the published content.
        </p>
        <div className="mt-3">
          <RewardTierTable tiers={tiers ?? []} />
        </div>
      </div>
    </Panel>
  );
}
