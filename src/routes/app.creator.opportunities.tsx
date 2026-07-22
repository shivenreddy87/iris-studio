import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase } from "lucide-react";
import { listMyDeals } from "@/lib/deals.functions";

export const Route = createFileRoute("/app/creator/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunities — Project Eros" },
      { name: "description", content: "Brand invitations." },
    ],
  }),
  component: OpportunitiesPage,
});

function OpportunitiesPage() {
  const fetchFn = useServerFn(listMyDeals);
  const { data: deals = [] } = useQuery({ queryKey: ["my-deals"], queryFn: () => fetchFn() });
  const invited = deals.filter((d) => d.stage === "invited" || d.stage === "negotiating");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Creator</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">Opportunities</h1>
      </div>
      {invited.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-surface-2/50 p-16 text-center">
          <Briefcase className="mx-auto mb-4 size-10 text-ink/30" />
          <p className="text-sm text-ink-dim">No open invitations yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {invited.map((d) => (
            <Link
              key={d.id}
              to="/app/deals/$id"
              params={{ id: d.id }}
              className="rounded-2xl border border-hairline bg-surface-2 p-5 shadow-sm hover:border-violet/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-bold text-ink">{d.campaign?.name ?? "Campaign"}</p>
                  <p className="mt-1 text-xs text-ink-mute">{d.campaign?.brief?.slice(0, 100)}…</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs uppercase tracking-widest text-ink-mute">Offer</p>
                  <p className="font-display text-xl font-bold text-ink">₹{(d.offer ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
