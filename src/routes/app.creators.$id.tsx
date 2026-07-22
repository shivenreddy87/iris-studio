import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { getCreator } from "@/lib/creators.functions";
import { listCampaigns } from "@/lib/campaigns.functions";
import { createDeal } from "@/lib/deals.functions";
import { useState } from "react";

export const Route = createFileRoute("/app/creators/$id")({
  head: () => ({
    meta: [
      { title: "Creator — Project Eros" },
      { name: "description", content: "Creator profile." },
    ],
  }),
  component: CreatorProfilePage,
});

function CreatorProfilePage() {
  const { id } = useParams({ from: "/app/creators/$id" });
  const queryClient = useQueryClient();
  const fetchCreator = useServerFn(getCreator);
  const fetchCampaigns = useServerFn(listCampaigns);
  const invite = useServerFn(createDeal);

  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [offer, setOffer] = useState("100000");

  const { data: creator, isLoading } = useQuery({
    queryKey: ["creator", id],
    queryFn: () => fetchCreator({ data: { user_id: id } }),
  });
  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns(),
  });

  const inviteMutation = useMutation({
    mutationFn: () =>
      invite({
        data: {
          campaign_id: selectedCampaign,
          creator_user_id: id,
          offer: Number(offer) || 0,
        },
      }),
    onSuccess: () => {
      toast.success("Invitation sent");
      queryClient.invalidateQueries({ queryKey: ["my-deals"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-10 text-center text-midnight/50">Loading…</div>;
  if (!creator) return <div className="p-10 text-center text-midnight/50">Creator not found.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 lg:px-8">
      <Link
        to="/app/discover"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-midnight/60 hover:text-violet"
      >
        <ArrowLeft className="size-4" /> Back to discover
      </Link>

      <div className="rounded-3xl border border-midnight/5 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start gap-6">
          <div className={`grid size-24 place-items-center rounded-3xl ${creator.accent === "rose" ? "bg-rose/10 text-rose" : "bg-violet/10 text-violet"} font-display text-3xl font-bold`}>
            {(creator.display_name ?? "?").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-4xl font-extrabold text-midnight">{creator.display_name}</h1>
            <p className="mt-1 text-sm text-midnight/60">{creator.handle} · {creator.niche} · {creator.location ?? ""}</p>
            {creator.bio ? <p className="mt-4 max-w-2xl text-sm text-midnight/70">{creator.bio}</p> : null}
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <Stat label="Followers" value={(creator.followers ?? 0).toLocaleString()} />
          <Stat label="Engagement" value={`${(creator.engagement_rate ?? 0).toFixed(1)}%`} />
          <Stat label="Avg rate" value={`₹${(creator.avg_rate ?? 0).toLocaleString()}`} />
          <Stat label="Match score" value={creator.match_score ?? "—"} accent />
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-display text-lg font-bold text-midnight">Invite to a campaign</h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="rounded-full border border-midnight/10 bg-canvas px-4 py-2.5 text-sm"
          >
            <option value="">Select campaign…</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            type="number"
            value={offer}
            onChange={(e) => setOffer(e.target.value)}
            placeholder="Offer"
            className="w-40 rounded-full border border-midnight/10 bg-canvas px-4 py-2.5 text-sm"
          />
          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!selectedCampaign || inviteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
          >
            <MessageSquare className="size-4" /> {inviteMutation.isPending ? "Sending…" : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-midnight/5 bg-canvas p-4">
      <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${accent ? "text-violet" : "text-midnight"}`}>{value}</p>
    </div>
  );
}
