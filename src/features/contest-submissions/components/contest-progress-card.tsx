import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Panel } from "@/features/contests/components/detail-row";
import { getContestProgress } from "../submission.functions";
import { submissionKeys } from "../hooks/use-submissions";

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-3 p-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="mt-1 text-xl font-medium text-ink">{value}</p>
    </div>
  );
}

/**
 * Aggregate execution progress for a contest.
 * Businesses see counts only — never applicant or participant identities.
 */
export function ContestProgressCard({ contestId }: { contestId: string }) {
  const fetchProgress = useServerFn(getContestProgress);
  const { data, isLoading } = useQuery({
    queryKey: submissionKeys.progress(contestId),
    queryFn: () => fetchProgress({ data: { contestId } }),
  });

  if (isLoading) {
    return (
      <Panel title="Contest progress">
        <p className="text-sm text-ink-mute">Loading progress…</p>
      </Panel>
    );
  }
  if (!data) return null;

  return (
    <Panel title="Contest progress">
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Participants" value={data.totalParticipants} />
        <Stat label="Submitted" value={`${data.totalSubmitted} (${data.submissionRate}%)`} />
        <Stat label="Verified" value={data.verifiedCount} />
        <Stat label="Flagged" value={data.flaggedCount} />
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
        <div
          className="h-full rounded-full bg-violet transition-all"
          style={{ width: `${Math.min(data.submissionRate, 100)}%` }}
        />
      </div>
      <p className="mt-3 text-xs text-ink-mute">
        {data.pendingCount} pending · {data.hasEnded ? "Contest run has ended" : "Contest running"}
        {data.lastSubmissionAt
          ? ` · Last submission ${new Date(data.lastSubmissionAt).toLocaleDateString()}`
          : ""}
      </p>
    </Panel>
  );
}
