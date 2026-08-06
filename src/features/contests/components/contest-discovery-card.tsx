import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ContestStatusBadge } from "./contest-status-badge";
import { SavedContestButton } from "./saved-contest-button";
import { dash, dateOr, money, numOr } from "./detail-row";
import { ELIGIBILITY_REASON_LABELS } from "../eligibility";
import type { DiscoveryContest } from "../types";

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

/**
 * Discovery card for influencers. The action row reserves space for the Apply
 * button introduced with Contest Applications.
 */
export function ContestDiscoveryCard({ item }: { item: DiscoveryContest }) {
  const { contest, eligibility, availability, saved } = item;
  const range =
    contest.minimumFollowers === null && contest.maximumFollowers === null
      ? "Any"
      : `${numOr(contest.minimumFollowers)} – ${
          contest.maximumFollowers === null ? "no cap" : numOr(contest.maximumFollowers)
        }`;

  return (
    <article className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            to="/app/contests/$contestId"
            params={{ contestId: contest.id }}
            className="font-display text-base font-semibold text-ink hover:text-violet"
          >
            {contest.title}
          </Link>
          <p className="text-sm text-ink-dim">
            {dash(contest.businessCategory)}
            {contest.targetPlatform ? ` · ${contest.targetPlatform}` : ""}
          </p>
        </div>
        <ContestStatusBadge status={contest.status} />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-y-3 sm:grid-cols-4">
        <Stat label="Reward pool" value={money(contest.rewardPool)} />
        <Stat label="Required views" value={numOr(contest.requiredViews)} />
        <Stat label="Participants" value={numOr(contest.participantLimit)} />
        <Stat label="Winners" value={numOr(contest.winnerCount)} />
        <Stat label="Creator category" value={dash(contest.preferredCreatorCategory)} />
        <Stat label="Followers" value={range} />
        <Stat label="Contest starts" value={dateOr(contest.contestStartDate)} />
        <Stat label="Applications close" value={dateOr(contest.applicationDeadline)} />
      </dl>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-hairline pt-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          {availability.label}
          {eligibility.eligible
            ? " · Eligible"
            : ` · ${ELIGIBILITY_REASON_LABELS[eligibility.reasons[0] ?? "eligible"]}`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <SavedContestButton contestId={contest.id} saved={saved} />
          {/* Reserved for the Apply action shipping with Contest Applications. */}
          <Link
            to="/app/contests/$contestId"
            params={{ contestId: contest.id }}
            className="inline-flex h-8 items-center rounded-full border border-hairline px-4 text-sm text-ink-dim hover:text-ink"
          >
            View contest
          </Link>
        </div>
      </div>
    </article>
  );
}
