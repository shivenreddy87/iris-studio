import { Link } from "@tanstack/react-router";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import {
  CAMPAIGN_REQUEST_STATUS_LABELS,
  type CampaignRequest,
  type CampaignRequestStatus,
} from "../types";

const TONES: Record<CampaignRequestStatus, StatusTone> = {
  draft: "neutral",
  submitted: "info",
  in_review: "warning",
  approved: "success",
  rejected: "danger",
  converted: "active",
};

export function CampaignRequestStatusBadge({ status }: { status: CampaignRequestStatus }) {
  return <StatusBadge label={CAMPAIGN_REQUEST_STATUS_LABELS[status]} tone={TONES[status]} />;
}

export function CampaignRequestList({
  requests,
  basePath = "/app/business/requests",
}: {
  requests: CampaignRequest[];
  basePath?: "/app/business/requests" | "/app/admin/requests";
}) {
  return (
    <div className="space-y-3">
      {requests.map((request) => (
        <Link
          key={request.id}
          to={`${basePath}/$requestId`}
          params={{ requestId: request.id }}
          className="block rounded-2xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-violet/30"
        >
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="font-display text-base font-semibold text-ink">{request.title}</span>
            <CampaignRequestStatusBadge status={request.status} />
          </div>
          {request.brief ? (
            <p className="line-clamp-2 text-sm text-ink-dim">{request.brief}</p>
          ) : null}
        </Link>
      ))}
    </div>
  );
}
