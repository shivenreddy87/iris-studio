import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { getBrandAnalytics } from "@/lib/analytics.functions";

export const Route = createFileRoute("/app/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Project Eros" },
      { name: "description", content: "Campaign performance." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const fetchFn = useServerFn(getBrandAnalytics);
  const { data, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: () => fetchFn(),
  });

  if (isLoading || !data) {
    return <div className="p-10 text-center text-ink-mute">Loading…</div>;
  }

  const { totals, topCreators, weeks } = data;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Analytics</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">Performance</h1>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Active campaigns" value={totals.activeCampaigns} />
        <Stat label="Total reach" value={totals.totalReach.toLocaleString()} />
        <Stat label="Engagements" value={totals.engagements.toLocaleString()} />
        <Stat label="Spend" value={`₹${(totals.totalSpend / 100000).toFixed(1)}L`} />
      </div>

      <div className="mb-6 rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Reach over time</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeks}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(260 50% 9%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff" }} />
              <Line type="monotone" dataKey="reach" stroke="#7657FF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="engagement" stroke="#F0647D" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-bold text-ink">Top creators</h2>
        {topCreators.length === 0 ? (
          <p className="text-sm text-ink-mute">No creator data yet.</p>
        ) : (
          <ul className="space-y-2">
            {topCreators.map((c) => (
              <li key={c.id} className="flex items-center justify-between rounded-xl bg-surface-2 p-3">
                <span className="font-semibold text-sm text-ink">{c.name}</span>
                <div className="flex gap-6 text-xs">
                  <span className="text-ink-dim">{c.count} deals</span>
                  <span className="font-mono text-ink">₹{c.total.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
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
