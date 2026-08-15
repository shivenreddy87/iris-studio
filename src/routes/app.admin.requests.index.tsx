import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/profiles/components/field";
import { listAllCampaignRequests } from "@/features/campaign-requests/requests.functions";
import { CampaignRequestCard } from "@/features/campaign-requests/components/campaign-request-card";
import {
  CAMPAIGN_REQUEST_STATUSES,
  CAMPAIGN_REQUEST_STATUS_LABELS,
  type CampaignRequestStatus,
} from "@/features/campaign-requests/types";

export const Route = createFileRoute("/app/admin/requests/")({
  head: () => ({
    meta: [
      { title: "Campaign Requests — Creoinfo Admin" },
      {
        name: "description",
        content: "Browse, search and filter every campaign request submitted by businesses.",
      },
      { property: "og:title", content: "Campaign Requests — Creoinfo Admin" },
      {
        property: "og:description",
        content: "Browse, search and filter every campaign request submitted by businesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCampaignRequestsPage,
});

function AdminCampaignRequestsPage() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CampaignRequestStatus | "all">("all");
  const fetchItems = useServerFn(listAllCampaignRequests);

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["campaign-requests", "all"],
    queryFn: () => fetchItems(),
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || (r.businessName ?? "").toLowerCase().includes(q);
    });
  }, [data, query, status]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Admin"
        title="Campaign Requests"
        description="Every brief submitted by businesses. Approval actions arrive in the next milestone."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
          <input
            className={`${fieldClass} pl-9`}
            placeholder="Search by title or business"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search campaign requests"
          />
        </div>
        <select
          className={`${fieldClass} sm:w-56`}
          value={status}
          onChange={(e) => setStatus(e.target.value as CampaignRequestStatus | "all")}
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          {CAMPAIGN_REQUEST_STATUSES.filter((s) => s !== "draft").map((s) => (
            <option key={s} value={s}>
              {CAMPAIGN_REQUEST_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={filtered.length === 0}
        empty={
          <EmptyState
            icon={<FileText className="size-8" />}
            title="No requests to review"
            hint="Submitted briefs land here for review."
          />
        }
      >
        <div className="space-y-3">
          {filtered.map((request) => (
            <CampaignRequestCard
              key={request.id}
              request={request}
              basePath="/app/admin/requests"
              actions={
                <Button size="sm" variant="outline" asChild>
                  <Link to="/app/admin/requests/$requestId" params={{ requestId: request.id }}>
                    Open details
                  </Link>
                </Button>
              }
            />
          ))}
        </div>
      </DataSection>
    </div>
  );
}
