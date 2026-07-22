import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Megaphone, Users, TrendingUp, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { listCampaigns } from "@/lib/campaigns.functions";
import { listMyDeals } from "@/lib/deals.functions";
import { ensureOrganization } from "@/lib/org.functions";
import { useEffect } from "react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Home — Project Eros" },
      { name: "description", content: "Your Project Eros workspace." },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  const { user, role } = useAuth();
  const fetchCampaigns = useServerFn(listCampaigns);
  const fetchDeals = useServerFn(listMyDeals);
  const ensureOrg = useServerFn(ensureOrganization);

  // For brands, ensure they have an org
  useEffect(() => {
    if (role === "brand") {
      ensureOrg().catch(() => {});
    }
  }, [role, ensureOrg]);

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => fetchCampaigns(),
    enabled: role === "brand",
  });
  const { data: deals = [] } = useQuery({
    queryKey: ["my-deals"],
    queryFn: () => fetchDeals(),
    enabled: !!user,
  });

  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? "there").split(/[\s@]/)[0];
  const activeCampaigns = campaigns.filter((c) => c.status === "live").length;
  const openDeals = deals.filter((d) => d.stage !== "cancelled" && d.stage !== "delivered").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-midnight/40">
          {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
          Good to see you, {firstName}.
        </h1>
      </div>

      <div className="mb-10 rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-midnight">
          <Sparkles className="size-4 text-violet" />
          Ask Iris
        </div>
        <Link
          to="/app/iris"
          className="block w-full rounded-2xl border border-midnight/10 bg-canvas px-5 py-4 text-base text-midnight/40 hover:border-violet/40"
        >
          {role === "creator"
            ? "e.g. Help me pitch to a new wellness brand…"
            : "e.g. Plan a Diwali campaign for our hydration line, ₹8L budget"}
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {role === "brand" ? (
          <StatCard icon={Megaphone} label="Active campaigns" value={activeCampaigns} to="/app/campaigns" />
        ) : (
          <StatCard icon={Briefcase} label="Active deals" value={openDeals} to="/app/creator/inbox" />
        )}
        <StatCard icon={Users} label="Open deals" value={openDeals} to={role === "creator" ? "/app/creator/inbox" : "/app/messages"} />
        <StatCard icon={TrendingUp} label={role === "brand" ? "Campaigns" : "Opportunities"} value={role === "brand" ? campaigns.length : deals.length} to={role === "brand" ? "/app/campaigns" : "/app/creator/opportunities"} />
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to }: { icon: typeof Sparkles; label: string; value: number; to: string }) {
  return (
    <Link to={to} className="group rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm hover:border-violet/30">
      <div className="mb-4 grid size-10 place-items-center rounded-xl bg-violet/10 text-violet">
        <Icon className="size-5" />
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-midnight/40">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-midnight">{value}</p>
    </Link>
  );
}
