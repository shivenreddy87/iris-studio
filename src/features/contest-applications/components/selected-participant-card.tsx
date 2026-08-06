import { ExternalLink } from "lucide-react";
import { dateOr } from "@/features/contests/components/detail-row";
import type { ContestParticipant } from "../types";
import { StatusBadge } from "@/components/shared/status-badge";
import { PARTICIPATION_STATUS_LABELS } from "../types";

/** One confirmed participant of a contest. */
export function SelectedParticipantCard({ participant }: { participant: ContestParticipant }) {
  return (
    <article className="rounded-2xl border border-hairline bg-surface-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {participant.influencerName ?? "Influencer"}
            {participant.influencerHandle ? (
              <span className="ml-2 text-ink-mute">@{participant.influencerHandle}</span>
            ) : null}
          </p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Selected {dateOr(participant.selectedAt)}
            {participant.activatedAt ? ` · Activated ${dateOr(participant.activatedAt)}` : ""}
          </p>
        </div>
        <StatusBadge
          label={PARTICIPATION_STATUS_LABELS[participant.participationStatus]}
          tone={participant.participationStatus === "active" ? "success" : "neutral"}
        />
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
        {participant.followers !== null ? `${participant.followers.toLocaleString()} followers` : "Followers —"}
        {participant.niche ? ` · ${participant.niche}` : ""}
      </p>
      {participant.portfolioUrl ? (
        <a
          href={participant.portfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-violet hover:underline"
        >
          Portfolio <ExternalLink className="size-3.5" />
        </a>
      ) : null}
    </article>
  );
}
