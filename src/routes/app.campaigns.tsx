import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { Plus, Sparkles, TrendingUp } from "lucide-react";
import { campaignsApi, type Campaign } from "@/lib/api/adapters";

const campaignsQuery = queryOptions({
  queryKey: ["campaigns"],
  queryFn: () => campaignsApi.list(),
});

export const Route = createFileRoute("/app/campaigns")({
  head: () => ({
    meta: [
      { title: "Campaigns — Project Eros" },
      { name: "description", content: "All your campaigns, orchestrated." },
      { property: "og:title", content: "Campaigns — Project Eros" },
      { property: "og:description", content: "Plan, launch, and track influencer campaigns." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(campaignsQuery),
  component: CampaignsPage,
});

const statusStyles: Record<Campaign["status"], string> = {
  live: "bg-emerald-500/10 text-emerald-700",
  review: "bg-amber-500/10 text-amber-700",
  draft: "bg-midnight/5 text-midnight/60",
  completed: "bg-violet/10 text-violet",
};

function CampaignsPage() {
  const { data } = useSuspenseQuery(campaignsQuery);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-midnight/40">
            Campaigns
          </p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
            Everything in motion.
          </h1>
        </div>
        <Link
          to="/app/campaigns/new"
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-midnight/20 transition-colors hover:bg-violet"
        >
          <Plus className="size-4" />
          New campaign
        </Link>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <Stat label="Active campaigns" value={data.filter((c) => c.status === "live").length.toString()} sub="Diwali launch peaking" />
        <Stat label="Creators engaged" value={data.reduce((s, c) => s + c.creators, 0).toString()} sub="+8 this week" />
        <Stat label="Total reach" value="1.66M" sub="↑ 22% vs last month" />
      </div>

      <div className="overflow-hidden rounded-3xl border border-midnight/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-canvas text-xs uppercase tracking-wider text-midnight/50">
            <tr>
              <th className="px-6 py-4 font-medium">Campaign</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Creators</th>
              <th className="px-6 py-4 font-medium">Spend</th>
              <th className="px-6 py-4 font-medium">Reach</th>
              <th className="px-6 py-4 font-medium">Engagement</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id} className="border-t border-midnight/5 transition-colors hover:bg-canvas/60">
                <td className="px-6 py-5">
                  <Link to="/app/campaigns/$id" params={{ id: c.id }} className="block">
                    <div className="font-semibold text-midnight">{c.name}</div>
                    <div className="mt-0.5 line-clamp-1 text-xs text-midnight/50">{c.brief}</div>
                  </Link>
                </td>
                <td className="px-6 py-5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusStyles[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-5 text-midnight/70">{c.creators}/{c.invited || "—"}</td>
                <td className="px-6 py-5 text-midnight/70">
                  {c.currency === "INR" ? "₹" : "$"}
                  {(c.spend / 1000).toFixed(0)}k
                </td>
                <td className="px-6 py-5 text-midnight/70">
                  {c.reach >= 1_000_000 ? `${(c.reach / 1_000_000).toFixed(2)}M` : `${(c.reach / 1000).toFixed(0)}k`}
                </td>
                <td className="px-6 py-5">
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <TrendingUp className="size-3.5" />
                    {c.engagementRate || "—"}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 rounded-3xl border border-violet/10 bg-gradient-to-br from-violet/5 via-white to-rose/5 p-6">
        <div className="flex items-start gap-4">
          <div className="grid size-10 place-items-center rounded-2xl bg-violet text-white">
            <Sparkles className="size-5" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-midnight">Iris noticed something.</p>
            <p className="mt-1 text-sm text-midnight/60">
              Your Diwali campaign is pacing 18% ahead. Want me to draft a follow-up with the same
              creator cohort for Republic Day?
            </p>
            <button className="mt-4 rounded-full bg-midnight px-4 py-2 text-xs font-semibold text-white hover:bg-violet">
              Draft it →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-midnight/5 bg-white p-5">
      <div className="font-mono text-xs uppercase tracking-widest text-midnight/40">{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold text-midnight">{value}</div>
      <div className="mt-1 text-xs text-midnight/50">{sub}</div>
    </div>
  );
}
