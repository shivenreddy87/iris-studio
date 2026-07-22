import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Calendar, DollarSign, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { campaignsApi } from "@/lib/api/adapters";

const campaignQuery = (id: string) =>
  queryOptions({
    queryKey: ["campaign", id],
    queryFn: async () => {
      const c = await campaignsApi.get(id);
      if (!c) throw notFound();
      const recs = await campaignsApi.recommendations(id);
      const invites = await campaignsApi.invitations(id);
      return { campaign: c, recommendations: recs, invitations: invites };
    },
  });

export const Route = createFileRoute("/app/campaigns/$id")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.campaign.name ?? "Campaign"} — Project Eros` },
      { name: "description", content: loaderData?.campaign.brief ?? "Campaign detail." },
      { property: "og:title", content: `${loaderData?.campaign.name ?? "Campaign"} — Project Eros` },
      { property: "og:description", content: loaderData?.campaign.brief ?? "Campaign detail." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(campaignQuery(params.id)),
  component: CampaignDetail,
  errorComponent: ({ error }) => <div className="p-10 text-sm text-rose">{(error as Error).message}</div>,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-midnight">Campaign not found.</h1>
      <Link to="/app/campaigns" className="mt-4 inline-block text-violet hover:underline">
        ← Back to campaigns
      </Link>
    </div>
  ),
});

function CampaignDetail() {
  const { id } = Route.useParams();
  const { data } = useSuspenseQuery(campaignQuery(id));
  const { campaign, recommendations, invitations } = data;
  const cur = campaign.currency === "INR" ? "₹" : "$";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <Link
        to="/app/campaigns"
        className="mb-6 inline-flex items-center gap-2 text-sm text-midnight/60 hover:text-midnight"
      >
        <ArrowLeft className="size-4" /> All campaigns
      </Link>

      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium capitalize text-emerald-700">
            <span className="size-1.5 rounded-full bg-emerald-500" /> {campaign.status}
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
            {campaign.name}
          </h1>
          <p className="mt-3 max-w-2xl text-midnight/60">{campaign.brief}</p>
        </div>
        <button className="rounded-full border border-midnight/10 bg-white px-5 py-2.5 text-sm font-semibold text-midnight hover:bg-canvas">
          Edit brief
        </button>
      </div>

      <div className="mb-10 grid gap-4 md:grid-cols-4">
        <Metric Icon={DollarSign} label="Budget" value={`${cur}${(campaign.budget / 1000).toFixed(0)}k`} sub={`${cur}${(campaign.spend / 1000).toFixed(0)}k spent`} />
        <Metric Icon={Users} label="Creators" value={`${campaign.creators}`} sub={`${campaign.invited} invited`} />
        <Metric Icon={TrendingUp} label="Reach" value={campaign.reach >= 1_000_000 ? `${(campaign.reach / 1_000_000).toFixed(2)}M` : `${(campaign.reach / 1000).toFixed(0)}k`} sub={`${campaign.engagementRate}% ER`} />
        <Metric Icon={Calendar} label="Runs" value={new Date(campaign.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} sub={`→ ${new Date(campaign.endsAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`} />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-5 flex items-center gap-2 font-display text-xl font-bold text-midnight">
              <Target className="size-5 text-violet" /> Deal pipeline
            </h2>
            <div className="space-y-3">
              {invitations.length === 0 ? (
                <p className="text-sm text-midnight/50">No invitations yet.</p>
              ) : (
                invitations.map((d) => (
                  <Link
                    key={d.id}
                    to="/app/deals/$id"
                    params={{ id: d.id }}
                    className="flex items-center gap-4 rounded-2xl border border-midnight/5 bg-canvas p-4 hover:border-violet/30"
                  >
                    <div className="size-10 rounded-full bg-gradient-to-tr from-violet to-rose" />
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-midnight">{d.creatorId}</div>
                      <div className="text-xs text-midnight/50 capitalize">{d.stage.replace("-", " ")} · updated {d.lastUpdate}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-midnight">${d.offer.toLocaleString()}</div>
                      {d.counter ? <div className="text-xs text-rose">counter ${d.counter.toLocaleString()}</div> : null}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-5 font-display text-xl font-bold text-midnight">Performance</h2>
            <div className="grid grid-cols-7 items-end gap-2 h-40">
              {[30, 42, 38, 55, 61, 72, 68].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-lg bg-gradient-to-t from-violet to-rose"
                    style={{ height: `${h}%` }}
                  />
                  <span className="font-mono text-[10px] text-midnight/40">W{i + 1}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-violet/10 bg-gradient-to-br from-violet/5 via-white to-rose/5 p-6">
            <div className="mb-4 flex items-center gap-2 text-violet">
              <Sparkles className="size-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Iris recommends</span>
            </div>
            <div className="space-y-3">
              {recommendations.map((c) => (
                <Link
                  key={c.id}
                  to="/app/creators/$id"
                  params={{ id: c.id }}
                  className="flex items-center gap-3 rounded-2xl bg-white/70 p-3 hover:bg-white"
                >
                  <div className="size-9 rounded-full bg-gradient-to-tr from-violet to-rose" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-semibold text-midnight">{c.name}</div>
                    <div className="truncate text-xs text-midnight/50">{c.niche}</div>
                  </div>
                  <div className="rounded-full bg-violet/10 px-2 py-0.5 text-xs font-bold text-violet">
                    {c.matchScore}%
                  </div>
                </Link>
              ))}
            </div>
            <button className="mt-4 w-full rounded-full bg-midnight py-2.5 text-xs font-semibold text-white hover:bg-violet">
              Invite all
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ Icon, label, value, sub }: { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl border border-midnight/5 bg-white p-5">
      <div className="mb-3 flex items-center gap-2 text-midnight/50">
        <Icon className="size-4" />
        <span className="font-mono text-xs uppercase tracking-widest">{label}</span>
      </div>
      <div className="font-display text-2xl font-extrabold text-midnight">{value}</div>
      <div className="mt-1 text-xs text-midnight/50">{sub}</div>
    </div>
  );
}
