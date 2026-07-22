import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Users } from "lucide-react";
import { getCampaign } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/app/campaigns/$id")({
  head: () => ({
    meta: [
      { title: "Campaign — Project Eros" },
      { name: "description", content: "Campaign detail." },
    ],
  }),
  component: CampaignDetailPage,
});

const stageLabel: Record<string, string> = {
  invited: "Invited",
  negotiating: "Negotiating",
  agreed: "Agreed",
  in_production: "In production",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

function CampaignDetailPage() {
  const { id } = useParams({ from: "/app/campaigns/$id" });
  const fetchFn = useServerFn(getCampaign);
  const { data, isLoading } = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => fetchFn({ data: { id } }),
  });

  if (isLoading) {
    return <div className="p-10 text-center text-muted">Loading…</div>;
  }
  if (!data?.campaign) {
    return <div className="p-10 text-center text-muted">Campaign not found.</div>;
  }

  const { campaign, deals } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link
        to="/app/campaigns"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-secondary hover:text-violet"
      >
        <ArrowLeft className="size-4" /> Back to campaigns
      </Link>

      <div className="mb-8 rounded-3xl border border-hairline bg-surface-2 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">
              {campaign.status}
            </p>
            <h1 className="font-display text-3xl font-extrabold text-primary">{campaign.name}</h1>
            {campaign.brief ? (
              <p className="mt-3 max-w-2xl text-sm text-secondary">{campaign.brief}</p>
            ) : null}
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">Budget</p>
              <p className="font-display text-xl font-bold text-primary">₹{((campaign.budget ?? 0) / 100000).toFixed(1)}L</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">Reach</p>
              <p className="font-display text-xl font-bold text-primary">{(campaign.reach ?? 0).toLocaleString()}</p>
            </div>
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-muted">Engagement</p>
              <p className="font-display text-xl font-bold text-primary">{(campaign.engagement_rate ?? 0).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-primary">Deals</h2>
        <Link
          to="/app/discover"
          className="rounded-full bg-midnight px-4 py-2 text-xs font-semibold text-white hover:bg-violet"
        >
          Add creators
        </Link>
      </div>

      {deals.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-surface-2/50 p-16 text-center">
          <Users className="mx-auto mb-4 size-10 text-primary/30" />
          <p className="text-sm text-secondary">No creators yet. Invite some from Discover.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {deals.map((d) => (
            <Link
              key={d.id}
              to="/app/deals/$id"
              params={{ id: d.id }}
              className="flex items-center justify-between rounded-2xl border border-hairline bg-surface-2 p-4 shadow-sm hover:border-violet/30"
            >
              <div className="flex items-center gap-4">
                <div className={`grid size-11 place-items-center rounded-xl ${d.creator?.accent === "rose" ? "bg-rose/10 text-rose" : "bg-violet/10 text-violet"} font-display font-bold`}>
                  {(d.creator?.display_name ?? "?").slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-primary">{d.creator?.display_name ?? "Creator"}</p>
                  <p className="text-xs text-muted">{d.creator?.handle ?? ""} · {d.creator?.niche ?? ""}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">Offer</p>
                  <p className="font-semibold text-primary">₹{(d.offer ?? 0).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-surface-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary">
                  {stageLabel[d.stage] ?? d.stage}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
