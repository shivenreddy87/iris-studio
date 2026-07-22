import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { dealsApi } from "@/lib/api/adapters";
import { creators as allCreators, campaigns as allCampaigns } from "@/lib/api/mock-data";

const dealQuery = (id: string) =>
  queryOptions({
    queryKey: ["deal", id],
    queryFn: async () => {
      const d = await dealsApi.get(id);
      if (!d) throw notFound();
      return d;
    },
  });

export const Route = createFileRoute("/app/deals/$id")({
  head: () => ({
    meta: [
      { title: "Deal workspace — Project Eros" },
      { name: "description", content: "Negotiate, agree, ship." },
      { property: "og:title", content: "Deal workspace — Project Eros" },
      { property: "og:description", content: "Deal negotiation workspace." },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(dealQuery(params.id)),
  component: DealPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="font-display text-3xl font-bold text-midnight">Deal not found.</h1>
    </div>
  ),
});

const stages = ["invited", "negotiating", "agreed", "in-production", "delivered"] as const;

function DealPage() {
  const { id } = Route.useParams();
  const { data: d } = useSuspenseQuery(dealQuery(id));
  const creator = allCreators.find((c) => c.id === d.creatorId);
  const campaign = allCampaigns.find((c) => c.id === d.campaignId);
  const activeIdx = stages.indexOf(d.stage);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link to="/app/campaigns/$id" params={{ id: d.campaignId }} className="mb-6 inline-flex items-center gap-2 text-sm text-midnight/60 hover:text-midnight">
        <ArrowLeft className="size-4" /> {campaign?.name}
      </Link>

      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-gradient-to-tr from-violet to-rose" />
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">Deal workspace</p>
            <h1 className="font-display text-3xl font-extrabold text-midnight">{creator?.name}</h1>
            <p className="text-sm text-midnight/50">{creator?.handle}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-xs uppercase tracking-widest text-midnight/40">Current offer</div>
          <div className="font-display text-3xl font-extrabold text-midnight">${d.offer.toLocaleString()}</div>
          {d.counter ? <div className="text-sm text-rose">counter ${d.counter.toLocaleString()}</div> : null}
        </div>
      </div>

      {/* Pipeline */}
      <div className="mb-10 rounded-3xl border border-midnight/5 bg-white p-6">
        <div className="flex items-center gap-2">
          {stages.map((s, i) => {
            const done = i < activeIdx;
            const active = i === activeIdx;
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid size-8 place-items-center rounded-full text-xs font-bold ${
                    done ? "bg-emerald-500 text-white" : active ? "bg-midnight text-white" : "bg-midnight/5 text-midnight/40"
                  }`}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <div className={`text-xs font-medium capitalize ${active || done ? "text-midnight" : "text-midnight/40"}`}>
                  {s.replace("-", " ")}
                </div>
                {i < stages.length - 1 ? <div className={`h-px flex-1 ${done ? "bg-emerald-500" : "bg-midnight/10"}`} /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-midnight">Deliverables</h2>
            <ul className="space-y-3">
              {["1 × 45s Instagram Reel", "3 × Instagram Stories", "1 × TikTok cross-post", "Usage rights: 90 days"].map((li) => (
                <li key={li} className="flex items-center gap-3 rounded-xl bg-canvas px-4 py-3 text-sm text-midnight/70">
                  <Check className="size-4 text-violet" /> {li}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h2 className="mb-4 font-display text-lg font-bold text-midnight">Contract</h2>
            <div className="rounded-2xl border border-dashed border-midnight/15 bg-canvas p-6 text-sm text-midnight/60">
              Draft ready. Iris pre-filled deliverables, timeline, and usage. Review before sending.
            </div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet">
                Send for signature
              </button>
              <button className="rounded-full border border-midnight/10 px-5 py-2.5 text-sm font-semibold text-midnight hover:bg-canvas">
                Edit draft
              </button>
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-violet/10 bg-gradient-to-br from-violet/5 via-white to-rose/5 p-6">
            <div className="mb-3 flex items-center gap-2 text-violet">
              <Sparkles className="size-4" />
              <span className="font-mono text-xs uppercase tracking-widest">Iris suggests</span>
            </div>
            <p className="text-sm leading-relaxed text-midnight/70">
              Their counter is 15% above median, but their conversion rate on similar deals is 2.1×.
              I'd accept — the ROI holds.
            </p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-full bg-midnight py-2 text-xs font-semibold text-white hover:bg-violet">Accept counter</button>
              <button className="flex-1 rounded-full border border-midnight/10 py-2 text-xs font-semibold text-midnight hover:bg-white">Counter</button>
            </div>
          </section>

          <section className="rounded-3xl border border-midnight/5 bg-white p-6">
            <h3 className="mb-3 font-display text-sm font-bold text-midnight">Timeline</h3>
            <ol className="space-y-3 text-xs">
              {[
                { t: "Invitation sent", d: "5d ago" },
                { t: "Creator opened brief", d: "4d ago" },
                { t: "Counter offer received", d: "12m ago" },
              ].map((e) => (
                <li key={e.t} className="flex gap-3">
                  <div className="mt-1 size-2 shrink-0 rounded-full bg-violet" />
                  <div>
                    <div className="font-medium text-midnight">{e.t}</div>
                    <div className="text-midnight/40">{e.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </div>
  );
}
