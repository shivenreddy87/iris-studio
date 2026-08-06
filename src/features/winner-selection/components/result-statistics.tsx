import { money, numOr } from "@/features/contests/components/detail-row";
import type { ContestStatistics } from "../scoring";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="mt-1 text-xl font-medium text-ink">{value}</p>
    </div>
  );
}

/** Aggregate performance across every scored submission. No identities. */
export function ResultStatistics({
  statistics,
  rewardPool,
}: {
  statistics: ContestStatistics;
  rewardPool?: number | null;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Stat label="Total views" value={numOr(statistics.totalViews)} />
      <Stat label="Total engagements" value={numOr(statistics.totalEngagements)} />
      <Stat label="Avg engagement rate" value={`${statistics.averageEngagementRate}%`} />
      <Stat label="Average score" value={statistics.averageScore} />
      <Stat label="Top score" value={statistics.topScore} />
      {rewardPool !== undefined ? <Stat label="Reward pool" value={money(rewardPool)} /> : null}
    </div>
  );
}

/** Per-submission metric breakdown. */
export function PerformanceMetricsCard({
  views,
  likes,
  comments,
  shares,
  engagementRate,
  score,
}: {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagementRate: number;
  score?: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Stat label="Views" value={numOr(views)} />
      <Stat label="Likes" value={numOr(likes)} />
      <Stat label="Comments" value={numOr(comments)} />
      <Stat label="Shares" value={numOr(shares)} />
      <Stat label="Engagement rate" value={`${engagementRate}%`} />
      {score !== undefined ? <Stat label="Performance score" value={score} /> : null}
    </div>
  );
}
