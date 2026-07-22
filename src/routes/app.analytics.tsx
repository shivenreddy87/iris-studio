import { createFileRoute } from "@tanstack/react-router";
import { TrendingUp, Users, DollarSign, Eye, Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Project Eros" },
      { name: "description", content: "Reach, engagement, spend — Iris connects the dots." },
      { property: "og:title", content: "Analytics — Project Eros" },
      { property: "og:description", content: "Campaign analytics with narrative insights." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-midnight/40">Analytics</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
          The numbers, told as a story.
        </h1>
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <KPI Icon={Eye} label="Total reach" value="1.66M" delta="+22%" />
        <KPI Icon={Users} label="Engagements" value="98.4k" delta="+14%" />
        <KPI Icon={DollarSign} label="Spend" value="$68.4k" delta="+8%" />
        <KPI Icon={TrendingUp} label="ROAS" value="4.2×" delta="+0.6×" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-3xl border border-midnight/5 bg-white p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-midnight">Reach vs engagement</h2>
            <div className="flex gap-2 text-xs">
              {["7d", "30d", "90d"].map((r, i) => (
                <button
                  key={r}
                  className={`rounded-full px-3 py-1 font-semibold ${
                    i === 1 ? "bg-midnight text-white" : "text-midnight/50 hover:bg-canvas"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex h-56 items-end gap-2">
            {[40, 55, 48, 62, 72, 68, 84, 78, 92, 88, 96, 90].map((h, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full items-end gap-1">
                  <div className="flex-1 rounded-t-md bg-violet" style={{ height: `${h * 1.8}px` }} />
                  <div className="flex-1 rounded-t-md bg-rose/70" style={{ height: `${h * 1.2}px` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-6 text-xs text-midnight/60">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-violet" /> Reach</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-rose/70" /> Engagement</span>
          </div>
        </section>

        <section className="rounded-3xl border border-violet/10 bg-gradient-to-br from-violet/5 via-white to-rose/5 p-6">
          <div className="mb-3 flex items-center gap-2 text-violet">
            <Sparkles className="size-4" />
            <span className="font-mono text-xs uppercase tracking-widest">Iris story</span>
          </div>
          <h3 className="font-display text-lg font-bold text-midnight">
            Your micro-creators outperformed macros by 3.2×.
          </h3>
          <p className="mt-2 text-sm text-midnight/60">
            Aria and Nia drove 42% of total engagement at 18% of the spend. Consider expanding your
            micro roster for Q1.
          </p>
          <div className="mt-5 space-y-2">
            {[
              { name: "Aria Vance", v: "38.4k", pct: 88 },
              { name: "Nia Okafor", v: "22.1k", pct: 62 },
              { name: "Julian Chen", v: "18.9k", pct: 48 },
              { name: "Elena Rossi", v: "11.2k", pct: 32 },
            ].map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex justify-between text-xs">
                  <span className="text-midnight/70">{c.name}</span>
                  <span className="font-semibold text-midnight">{c.v}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white">
                  <div className="h-1.5 rounded-full bg-gradient-to-r from-violet to-rose" style={{ width: `${c.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function KPI({ Icon, label, value, delta }: { Icon: React.ComponentType<{ className?: string }>; label: string; value: string; delta: string }) {
  return (
    <div className="rounded-3xl border border-midnight/5 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="grid size-9 place-items-center rounded-xl bg-canvas text-midnight/70">
          <Icon className="size-4" />
        </div>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {delta}
        </span>
      </div>
      <div className="font-display text-3xl font-extrabold text-midnight">{value}</div>
      <div className="mt-1 text-xs text-midnight/50">{label}</div>
    </div>
  );
}
