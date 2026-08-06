import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { CampaignStatusBadge } from "./campaign-status-badge";
import { RequestTimeline } from "./request-timeline";
import { AttachmentPreview } from "./attachment-preview";
import { isEditableStatus, type CampaignRequest } from "../types";

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
}: {
  request: CampaignRequest;
  showEdit?: boolean;
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
        <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
          <h3 className="mb-4 font-display text-lg font-semibold text-ink">Status timeline</h3>
          <RequestTimeline request={request} />
        </div>
        <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
          <h3 className="mb-2 font-display text-lg font-semibold text-ink">Review notes</h3>
          <p className="text-sm text-ink-dim">
            {request.reviewNotes ?? "No review notes yet. Notes appear here once an admin reviews this request."}
          </p>
        </div>
      </div>
    </div>
  );
}
