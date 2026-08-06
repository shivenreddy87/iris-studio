import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { RequestTimeline } from "./request-timeline";
import { ReviewTimeline } from "./review-timeline";
import { AttachmentPreview } from "./attachment-preview";
import { isEditableStatus, type CampaignRequest, type CampaignRequestEvent } from "../types";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-hairline py-3 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

const nf = new Intl.NumberFormat();
const dash = (v: string | null) => (v && v.trim() !== "" ? v : "—");
const numOr = (v: number | null) => (v === null ? "—" : nf.format(v));

export function CampaignRequestDetail({
  request,
  showEdit = false,
  events,
  aside,
}: {
  request: CampaignRequest;
  showEdit?: boolean;
  /** When provided, the event-sourced review history replaces the linear timeline. */
  events?: CampaignRequestEvent[];
  /** Extra panels rendered in the right-hand column (review actions, internal notes). */
  aside?: ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              {request.title || "Untitled request"}
            </h2>
            <CampaignStatusBadge status={request.status} />
          </div>
          {showEdit && isEditableStatus(request.status) ? (
            <Link
              to="/app/business/requests/$requestId/edit"
              params={{ requestId: request.id }}
              className="text-sm text-violet hover:underline"
            >
              Edit this draft
            </Link>
          ) : null}
          <dl className="mt-4 grid gap-x-8 sm:grid-cols-2">
            <DetailRow label="Business" value={dash(request.businessName)} />
            <DetailRow label="Business category" value={dash(request.businessCategory)} />
            <DetailRow label="Campaign goal" value={dash(request.campaignGoal)} />
            <DetailRow label="Target audience" value={dash(request.targetAudience)} />
            <DetailRow label="Target location" value={dash(request.targetLocation)} />
            <DetailRow label="Target platform" value={dash(request.targetPlatform)} />
            <DetailRow label="Required views" value={numOr(request.requiredViews)} />
            <DetailRow
              label="Budget"
              value={request.budget === null ? "—" : `₹${nf.format(request.budget)}`}
            />
            <DetailRow
              label="Duration"
              value={request.durationDays ? `${request.durationDays} days` : "—"}
            />
            <DetailRow
              label="Preferred creator category"
              value={dash(request.preferredCreatorCategory)}
            />
            <DetailRow label="Minimum followers" value={numOr(request.minimumFollowers)} />
            <DetailRow label="Maximum followers" value={numOr(request.maximumFollowers)} />
          </dl>
          <div className="mt-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink-dim">
              {dash(request.campaignDescription)}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Attachment</h3>
          <AttachmentPreview path={request.attachmentUrl} />
        </div>
      </div>

      <div className="space-y-6">
        {request.approvalReference ? (
          <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              Approval reference
            </p>
            <p className="mt-1 font-mono text-sm text-ink">{request.approvalReference}</p>
          </div>
        ) : null}
        {aside}
        <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Status timeline</h3>
          {events ? <ReviewTimeline events={events} /> : <RequestTimeline request={request} />}
        </div>
        <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ink">Review outcome</h3>
          <p className="whitespace-pre-wrap text-sm text-ink-dim">
            {request.reviewReason ??
              request.reviewNotes ??
              "No review feedback yet. It appears here once an admin reviews this request."}
          </p>
        </div>
      </div>
    </div>
  );
}
