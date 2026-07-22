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
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-midnight/40">Creator</p>
        <h1 className="font-display text-4xl font-extrabold text-midnight">Opportunities</h1>
      </div>
      {invited.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-midnight/15 bg-white/50 p-16 text-center">
          <Briefcase className="mx-auto mb-4 size-10 text-midnight/30" />
          <p className="text-sm text-midnight/60">No open invitations yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {invited.map((d) => (
            <Link
              key={d.id}
              to="/app/deals/$id"
              params={{ id: d.id }}
              className="rounded-2xl border border-midnight/5 bg-white p-5 shadow-sm hover:border-violet/30"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-display text-lg font-bold text-midnight">{d.campaign?.name ?? "Campaign"}</p>
                  <p className="mt-1 text-xs text-midnight/50">{d.campaign?.brief?.slice(0, 100)}…</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">Offer</p>
                  <p className="font-display text-xl font-bold text-midnight">₹{(d.offer ?? 0).toLocaleString()}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
