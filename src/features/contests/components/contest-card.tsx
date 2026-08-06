import { Link } from "@tanstack/react-router";
import { ContestStatusBadge } from "./contest-status-badge";
import { dateOr, money, numOr } from "./detail-row";
import type { Contest } from "../types";

export function ContestCard({
  contest,
  to = "admin",
}: {
  contest: Contest;
  /** Which detail surface the card links to. */
  to?: "admin" | "business";
}) {
  const inner = (
    <>
      <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-base font-semibold text-ink">{contest.title}</p>
          <p className="text-sm text-ink-dim">{contest.businessName ?? "Business"}</p>
        </div>
        <ContestStatusBadge status={contest.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-4">
        <Stat label="Reward pool" value={money(contest.rewardPool)} />
        <Stat label="Required views" value={numOr(contest.requiredViews)} />
        <Stat label="Participants" value={numOr(contest.participantLimit)} />
        <Stat label="Winners" value={numOr(contest.winnerCount)} />
      </dl>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
        Created {dateOr(contest.createdAt)}
        {contest.approvalReference ? ` · ${contest.approvalReference}` : ""}
      </p>
    </>
  );

  const className =
    "block rounded-3xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-violet/30";

  return to === "admin" ? (
    <Link
      to="/app/admin/contests/$contestId"
      params={{ contestId: contest.id }}
      className={className}
    >
      {inner}
    </Link>
  ) : (
    <Link
      to="/app/business/contests/$contestId"
      params={{ contestId: contest.id }}
      className={className}
    >
      {inner}
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}
