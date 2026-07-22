import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getDeal, updateDealStage, updateDealOffer } from "@/lib/deals.functions";

export const Route = createFileRoute("/app/deals/$id")({
  head: () => ({
    meta: [
      { title: "Deal — Project Eros" },
      { name: "description", content: "Deal workspace." },
    ],
  }),
  component: DealPage,
});

const stages = [
  { key: "invited", label: "Invited" },
  { key: "negotiating", label: "Negotiating" },
  { key: "agreed", label: "Agreed" },
  { key: "in_production", label: "In production" },
  { key: "delivered", label: "Delivered" },
] as const;

function DealPage() {
  const { id } = useParams({ from: "/app/deals/$id" });
  const queryClient = useQueryClient();
  const fetchFn = useServerFn(getDeal);
  const updateStage = useServerFn(updateDealStage);
  const updateOffer = useServerFn(updateDealOffer);

  const { data, isLoading } = useQuery({
    queryKey: ["deal", id],
    queryFn: () => fetchFn({ data: { id } }),
  });
  const [counter, setCounter] = useState("");

  const stageMutation = useMutation({
    mutationFn: (stage: (typeof stages)[number]["key"] | "cancelled") =>
      updateStage({ data: { id, stage } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      toast.success("Deal updated");
    },
  });
  const offerMutation = useMutation({
    mutationFn: (val: number) => updateOffer({ data: { id, counter: val } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deal", id] });
      setCounter("");
      toast.success("Counter sent");
    },
  });

  if (isLoading) return <div className="p-10 text-center text-ink-mute">Loading…</div>;
  if (!data?.deal) return <div className="p-10 text-center text-ink-mute">Deal not found.</div>;

  const { deal, events } = data;
  const currentIdx = stages.findIndex((s) => s.key === deal.stage);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link
        to="/app/campaigns"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-dim hover:text-violet"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="mb-6 rounded-3xl border border-hairline bg-surface-2 p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-mute">Deal</p>
            <h1 className="font-display text-3xl font-extrabold text-ink">
              {deal.creator?.display_name ?? "Creator"} × {deal.campaign?.name ?? "Campaign"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-mono text-xs uppercase tracking-widest text-ink-mute">Current offer</p>
              <p className="font-display text-2xl font-bold text-ink">₹{(deal.offer ?? 0).toLocaleString()}</p>
              {deal.counter ? (
                <p className="text-xs text-rose">Counter: ₹{deal.counter.toLocaleString()}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2">
            {stages.map((s, i) => (
              <div key={s.key} className="flex flex-1 items-center gap-2">
                <div
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                    i <= currentIdx ? "bg-midnight text-white" : "bg-surface-2/10 text-ink-mute"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs font-medium ${i <= currentIdx ? "text-ink" : "text-ink-mute"}`}>
                  {s.label}
                </span>
                {i < stages.length - 1 ? (
                  <div className={`h-0.5 flex-1 ${i < currentIdx ? "bg-midnight" : "bg-surface-2/10"}`} />
                ) : null}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {stages.map((s) => (
            <button
              key={s.key}
              onClick={() => stageMutation.mutate(s.key)}
              disabled={deal.stage === s.key}
              className="rounded-full border border-hairline bg-surface-2 px-3 py-1.5 text-xs font-semibold text-ink-dim hover:border-violet/40 hover:text-violet disabled:opacity-40"
            >
              → {s.label}
            </button>
          ))}
          <button
            onClick={() => stageMutation.mutate("cancelled")}
            className="rounded-full border border-rose/20 bg-rose/5 px-3 py-1.5 text-xs font-semibold text-rose hover:bg-rose/10"
          >
            Decline
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Send a counter</h2>
        <div className="flex gap-2">
          <input
            type="number"
            value={counter}
            onChange={(e) => setCounter(e.target.value)}
            placeholder="Counter amount"
            className="flex-1 rounded-full border border-hairline bg-surface-2 px-4 py-2.5 text-sm"
          />
          <button
            onClick={() => counter && offerMutation.mutate(Number(counter))}
            disabled={!counter || offerMutation.isPending}
            className="rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
          >
            Send counter
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
        <h2 className="mb-3 font-display text-lg font-bold text-ink">Activity</h2>
        {events.length === 0 ? (
          <p className="text-sm text-ink-mute">No activity yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 border-b border-hairline pb-2 last:border-0">
                <span className="font-mono text-xs text-ink-mute">
                  {new Date(e.created_at).toLocaleString()}
                </span>
                <span className="text-ink-dim">{e.kind.replace(/_/g, " ")}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
