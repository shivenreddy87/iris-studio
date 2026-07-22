import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Wallet } from "lucide-react";
import { listMyDeals } from "@/lib/deals.functions";

export const Route = createFileRoute("/app/creator/earnings")({
  head: () => ({
    meta: [
      { title: "Earnings — Project Eros" },
      { name: "description", content: "Track your creator earnings." },
    ],
  }),
  component: EarningsPage,
});

function EarningsPage() {
  const fetchFn = useServerFn(listMyDeals);
  const { data: deals = [] } = useQuery({ queryKey: ["my-deals"], queryFn: () => fetchFn() });

  const earned = deals
    .filter((d) => d.stage === "delivered")
    .reduce((s, d) => s + (d.offer ?? 0), 0);
  const pending = deals
    .filter((d) => d.stage === "agreed" || d.stage === "in_production")
    .reduce((s, d) => s + (d.offer ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-midnight/40">Creator</p>
        <h1 className="font-display text-4xl font-extrabold text-midnight">Earnings</h1>
      </div>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
          <div className="mb-2 grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
            <Wallet className="size-5" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">Delivered</p>
          <p className="font-display text-3xl font-bold text-midnight">₹{earned.toLocaleString()}</p>
        </div>
        <div className="rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
          <div className="mb-2 grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
            <Wallet className="size-5" />
          </div>
          <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">In flight</p>
          <p className="font-display text-3xl font-bold text-midnight">₹{pending.toLocaleString()}</p>
        </div>
      </div>
      <div className="rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-bold text-midnight">All deals</h2>
        {deals.length === 0 ? (
          <p className="text-sm text-midnight/50">No deals yet.</p>
        ) : (
          <ul className="space-y-2">
            {deals.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-xl bg-canvas p-3 text-sm">
                <span className="font-semibold text-midnight">{d.campaign?.name ?? "Campaign"}</span>
                <div className="flex gap-6 text-xs">
                  <span className="rounded-full bg-white px-2 py-0.5 uppercase text-midnight/60">{d.stage}</span>
                  <span className="font-mono text-midnight">₹{(d.offer ?? 0).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
