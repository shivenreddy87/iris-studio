import { Link } from "@tanstack/react-router";
import { Calendar, Coins, Eye, Timer } from "lucide-react";
import type { ReactNode } from "react";
import { CampaignStatusBadge } from "./campaign-status-badge";
import type { CampaignRequest } from "../types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatNumber(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat().format(value);
}

function Stat({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-dim">
      {icon}
      {label}
    </span>
  );
}

export function CampaignRequestCard({
  request,
  basePath = "/app/business/requests",
  actions,
}: {
  request: CampaignRequest;
  basePath?: "/app/business/requests" | "/app/admin/requests";
  actions?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2 p-5 transition-colors hover:border-violet/30">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={`${basePath}/$requestId`}
            params={{ requestId: request.id }}
            className="font-display text-base font-semibold text-ink hover:text-violet"
          >
            {request.title || "Untitled request"}
          </Link>
          {request.businessName ? (
            <p className="mt-1 text-xs text-ink-mute">{request.businessName}</p>
          ) : null}
        </div>
        <CampaignStatusBadge status={request.status} />
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Stat
          icon={<Coins className="size-3.5" />}
          label={request.budget === null ? "No budget" : `₹${formatNumber(request.budget)}`}
        />
        <Stat
          icon={<Eye className="size-3.5" />}
          label={`${formatNumber(request.requiredViews)} views`}
        />
        <Stat
          icon={<Timer className="size-3.5" />}
          label={request.durationDays ? `${request.durationDays} days` : "No duration"}
        />
        <Stat icon={<Calendar className="size-3.5" />} label={formatDate(request.createdAt)} />
      </div>

      {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
