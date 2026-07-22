import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Sparkles, TrendingUp } from "lucide-react";
import { creatorsApi } from "@/lib/api/adapters";

const creatorQuery = (id: string) =>
  queryOptions({
    queryKey: ["creator", id],
    queryFn: async () => {
      const c = await creatorsApi.get(id);
      if (!c) throw notFound();
      return c;
    },
  });

export const Route = createFileRoute("/app/creators/$id")({
  head: ({ loaderData }) => {
    const c = loaderData as { name: string; bio: string } | undefined;
    return {
      meta: [
        { title: `${c?.name ?? "Creator"} — Project Eros` },
        { name: "description", content: c?.bio ?? "Creator profile." },
        { property: "og:title", content: `${c?.name ?? "Creator"} — Project Eros` },
        { property: "og:description", content: c?.bio ?? "Creator profile." },
      ],
    };
  },
  loader: ({ context, params }) => context.queryClient.ensureQueryData(creatorQuery(params.id)),
  component: CreatorProfile,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-midnight">Creator not found.</h1>
      <Link to="/app/discover" className="mt-4 inline-block text-violet hover:underline">← Back to Discover</Link>
    </div>
  ),
});

function CreatorProfile() {
  const { id } = Route.useParams();
  const { data: c } = useSuspenseQuery(creatorQuery(id));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link to="/app/discover" className="mb-6 inline-flex items-center gap-2 text-sm text-midnight/60 hover:text-midnight">
        <ArrowLeft className="size-4" /> Discover
      </Link>

      <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-midnight via-violet to-rose p-10 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex items-center gap-5">
            <div className="size-24 rounded-3xl bg-white/20 ring-4 ring-white/20 backdrop-blur" />
            <div>
              <div className="font-mono text-xs uppercase tracking-widest text-white/60">{c.handle}</div>
              <h1 className="font-display text-4xl font-extrabold tracking-tight">{c.name}</h1>
              <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/80">
                <MapPin className="size-3.5" /> {c.location}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 px-4 py-2 text-center backdrop-blur">
              <div className="font-mono text-xs uppercase tracking-widest text-white/60">Iris match</div>
              <div className="font-display text-2xl font-extrabold">{c.matchScore}%</div>
            </div>
            <button className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-midnight hover:bg-canvas">
              Invite to campaign
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Stat label="Followers" value={`${(c.followers / 1000).toFixed(0)}k`} />
        <Stat label="Engagement" value={`${c.engagementRate}%`} />
        <Stat label="Avg rate" value={`$${c.price.toLocaleString()}`} />
        <Stat label="Niche" value={c.niche} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-3 font-display text-xl font-bold text-midnight">About</h2>
            <p className="text-midnight/70 leading-relaxed">{c.bio}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {c.tags.map((t) => (
                <span key={t} className="rounded-full bg-canvas px-3 py-1 text-xs font-medium text-midnight/70">
                  {t}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-5 font-display text-xl font-bold text-midnight">Recent work</h2>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className={`aspect-square rounded-2xl bg-gradient-to-br ${
                    i % 2 ? "from-rose/30 to-violet/30" : "from-violet/30 to-midnight/30"
                  }`}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-violet/10 bg-gradient-to-br from-violet/5 via-white to-rose/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-violet">
              <Sparkles className="size-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Iris analysis</span>
            </div>
            <p className="text-sm leading-relaxed text-midnight/70">
              {c.name.split(" ")[0]}'s audience overlaps 84% with your Diwali target. Engagement trend
              is up 12% MoM. Best content type: 45-second Reels with product ritual.
            </p>
            <button className="mt-4 w-full rounded-full bg-midnight py-2.5 text-xs font-semibold text-white hover:bg-violet">
              Draft outreach
            </button>
          </section>

          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-midnight">
              <TrendingUp className="size-4 text-violet" /> Growth
            </h2>
            <div className="flex h-24 items-end gap-1.5">
              {[40, 55, 50, 62, 70, 68, 78, 82, 90].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-violet to-rose" style={{ height: `${h}%` }} />
              ))}
            </div>
            <p className="mt-3 text-xs text-midnight/50">Last 9 months</p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-midnight/5 bg-white p-4">
      <div className="font-mono text-xs uppercase tracking-widest text-midnight/40">{label}</div>
      <div className="mt-1 font-display text-xl font-extrabold text-midnight">{value}</div>
    </div>
  );
}
