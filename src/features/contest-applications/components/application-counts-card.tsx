import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Panel } from "@/features/contests/components/detail-row";
import { getContestApplicationCounts } from "../application.functions";
import { applicationKeys } from "../hooks/use-applications";
import { APPLICATION_STATUS_LABELS, ACTIVE_APPLICATION_STATUSES } from "../types";

/** Aggregate-only view for businesses and admins — no applicant identities. */
export function ApplicationCountsCard({ contestId }: { contestId: string }) {
  const fetchCounts = useServerFn(getContestApplicationCounts);
  const { data } = useQuery({
    queryKey: applicationKeys.counts(contestId),
    queryFn: () => fetchCounts({ data: { contestId } }),
  });

  return (
    <Panel title="Applications">
      <p className="font-display text-3xl font-semibold text-ink">{data?.total ?? 0}</p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
        Total applications received
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-3">
        {ACTIVE_APPLICATION_STATUSES.map((status) => (
          <div key={status} className="rounded-2xl border border-hairline bg-surface-3 p-3">
            <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              {APPLICATION_STATUS_LABELS[status]}
            </dt>
            <dd className="mt-1 text-lg font-semibold text-ink">{data?.byStatus[status] ?? 0}</dd>
          </div>
        ))}
      </dl>
    </Panel>
  );
}
