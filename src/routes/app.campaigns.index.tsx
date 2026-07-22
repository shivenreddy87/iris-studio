import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Megaphone } from "lucide-react";
import { listCampaigns } from "@/lib/campaigns.functions";

export const Route = createFileRoute("/app/campaigns/")({
  head: () => ({
    meta: [
      { title: "Campaigns — Project Eros" },
      { name: "description", content: "Your active influencer campaigns." },
    ],
  }),
  component: CampaignsPage,
});

const statusColor: Record<string, string> = {
  draft: "bg-surface-2/10 text-ink-dim",
  live: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  completed: "bg-violet/10 text-violet",
};

function CampaignsPage() {
  const fetchFn = useServerFn(listCampaigns);
  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchFn(),
  });

  const active = campaigns.filter((c) => c.status === "live");
  const totalSpend = campaigns.reduce((s, c) => s + (c.spend ?? 0), 0);
  const totalReach = campaigns.reduce((s, c) => s + (c.reach ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Campaigns</p>
          <h1 className="font-display text-4xl font-extrabold text-ink">All campaigns</h1>
        </div>
        <Link
          to="/app/campaigns/new"
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet"
        >
          <Plus className="size-4" />
          New campaign
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active" value={active.length} />
        <Stat label="Total reach" value={totalReach.toLocaleString()} />
        <Stat label="Total spend" value={`₹${(totalSpend / 100000).toFixed(1)}L`} />
      </div>

      {isLoading ? (
        <div className="rounded-3xl border border-hairline bg-surface-2 p-10 text-center text-ink-mute">
          Loading…
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-surface-2/50 p-16 text-center">
          <Megaphone className="mx-auto mb-4 size-10 text-ink/30" />
          <h3 className="font-display text-xl font-bold text-ink">No campaigns yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-dim">
            Compose your first brief with Iris and go live in minutes.
          </p>
          <Link
            to="/app/campaigns/new"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet"
          >
            <Plus className="size-4" /> Start a campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((c) => (
            <Link
              key={c.id}
              to="/app/campaigns/$id"
              params={{ id: c.id }}
              className="group rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm hover:border-violet/30"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${statusColor[c.status] ?? statusColor.draft}`}>
                  {c.status}
                </span>
                <span className="font-mono text-xs text-ink-mute">
                  {new Date(c.created_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-ink group-hover:text-violet">{c.name}</h3>
              {c.brief ? <p className="mt-2 line-clamp-2 text-sm text-ink-dim">{c.brief}</p> : null}
              <div className="mt-4 flex gap-6 text-xs">
                <div>
                  <p className="font-mono uppercase tracking-wider text-ink-mute">Budget</p>
                  <p className="font-semibold text-ink">₹{((c.budget ?? 0) / 100000).toFixed(1)}L</p>
                </div>
                <div>
                  <p className="font-mono uppercase tracking-wider text-ink-mute">Reach</p>
                  <p className="font-semibold text-ink">{(c.reach ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-mono uppercase tracking-wider text-ink-mute">Eng.</p>
                  <p className="font-semibold text-ink">{(c.engagement_rate ?? 0).toFixed(1)}%</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-2 p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-ink-mute">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
    </div>
  );
}
