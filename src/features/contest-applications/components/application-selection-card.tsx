import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { dateOr } from "@/features/contests/components/detail-row";
import {
  rejectApplication,
  selectParticipant,
  shortlistApplication,
} from "../participant-selection.functions";
import { SelectionStatusBadge } from "./selection-status-badge";
import { canTransitionApplication, type ContestApplication } from "../types";

/** One applicant row inside the participant selection workspace. */
export function ApplicationSelectionCard({
  application,
  canSelect,
  selectable,
  checked,
  onCheckedChange,
  onChanged,
}: {
  application: ContestApplication;
  /** False when the participant limit is reached or the contest is not in selection. */
  canSelect: boolean;
  /** False when the contest is archived or already live. */
  selectable: boolean;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  onChanged: () => void;
}) {
  const shortlist = useServerFn(shortlistApplication);
  const select = useServerFn(selectParticipant);
  const reject = useServerFn(rejectApplication);

  const payload = { contestId: application.contestId, applicationId: application.id };

  const shortlistMutation = useMutation({
    mutationFn: () => shortlist({ data: payload }),
    onSuccess: () => {
      toast.success("Applicant shortlisted");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const selectMutation = useMutation({
    mutationFn: () => select({ data: payload }),
    onSuccess: () => {
      toast.success("Participant selected");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rejectMutation = useMutation({
    mutationFn: () => reject({ data: payload }),
    onSuccess: () => {
      toast.success("Applicant rejected");
      onChanged();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const busy =
    shortlistMutation.isPending || selectMutation.isPending || rejectMutation.isPending;
  const canShortlist =
    selectable && canTransitionApplication(application.status, "shortlisted");
  const canPick =
    selectable && canSelect && canTransitionApplication(application.status, "selected");
  const canReject = selectable && canTransitionApplication(application.status, "rejected");

  return (
    <article className="rounded-2xl border border-hairline bg-surface-2 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {canReject ? (
            <Checkbox
              className="mt-1"
              checked={checked}
              onCheckedChange={(value) => onCheckedChange(value === true)}
              aria-label={`Select ${application.influencerName ?? "applicant"} for bulk actions`}
            />
          ) : null}
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">
              {application.influencerName ?? "Influencer"}
              {application.influencerHandle ? (
                <span className="ml-2 text-ink-mute">@{application.influencerHandle}</span>
              ) : null}
            </p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              Applied {dateOr(application.submittedAt)}
              {application.influencerFollowers !== null
                ? ` · ${application.influencerFollowers.toLocaleString()} followers`
                : ""}
              {application.influencerNiche ? ` · ${application.influencerNiche}` : ""}
            </p>
          </div>
        </div>
        <SelectionStatusBadge status={application.status} />
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-ink-dim">{application.contentIdea}</p>
      {application.notes ? (
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-mute">{application.notes}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href={application.portfolioUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-violet hover:underline"
        >
          Portfolio <ExternalLink className="size-3.5" />
        </a>
        {canShortlist ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => shortlistMutation.mutate()}
          >
            Shortlist
          </Button>
        ) : null}
        {canPick ? (
          <Button size="sm" disabled={busy} onClick={() => selectMutation.mutate()}>
            Select
          </Button>
        ) : null}
        {canReject ? (
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => rejectMutation.mutate()}
          >
            Reject
          </Button>
        ) : null}
      </div>
    </article>
  );
}
