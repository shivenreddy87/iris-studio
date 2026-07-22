import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles } from "lucide-react";
import { searchCreators } from "@/lib/creators.functions";

export const Route = createFileRoute("/app/discover")({
  head: () => ({
    meta: [
      { title: "Discover creators — Project Eros" },
      { name: "description", content: "AI-ranked creator discovery." },
    ],
  }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const [q, setQ] = useState("");
  const [niche, setNiche] = useState("");
  const fetchFn = useServerFn(searchCreators);
  const { data: creators = [], isLoading } = useQuery({
    queryKey: ["creators", q, niche],
    queryFn: () => fetchFn({ data: { query: q || undefined, niche: niche || undefined } }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">Discover</p>
        <h1 className="font-display text-4xl font-extrabold text-primary">Find your creators</h1>
      </div>

      <div className="mb-6 rounded-3xl border border-hairline bg-surface-2 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, handle, or vibe…"
              className="w-full rounded-full border border-hairline bg-surface-2 py-3 pl-11 pr-4 text-sm placeholder:text-muted focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
            />
          </div>
          <select
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="rounded-full border border-hairline bg-surface-2 px-4 py-3 text-sm"
          >
            <option value="">All niches</option>
            <option value="wellness">Wellness</option>
            <option value="beauty">Beauty</option>
            <option value="fashion">Fashion</option>
            <option value="food">Food</option>
            <option value="tech">Tech</option>
            <option value="fitness">Fitness</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-muted">Loading…</div>
      ) : creators.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-hairline bg-surface-2/50 p-16 text-center">
          <Sparkles className="mx-auto mb-4 size-10 text-primary/30" />
          <h3 className="font-display text-xl font-bold text-primary">No creators yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-secondary">
            When creators sign up, their profiles appear here. Try broadening your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {creators.map((c) => (
            <Link
              key={c.user_id}
              to="/app/creators/$id"
              params={{ id: c.user_id }}
              className="group rounded-3xl border border-hairline bg-surface-2 p-5 shadow-sm hover:border-violet/30"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`grid size-12 place-items-center rounded-xl ${c.accent === "rose" ? "bg-rose/10 text-rose" : "bg-violet/10 text-violet"} font-display font-bold`}>
                  {(c.display_name ?? "?").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-bold text-primary group-hover:text-violet">{c.display_name}</p>
                  <p className="truncate text-xs text-muted">{c.handle} · {c.niche}</p>
                </div>
              </div>
              {c.bio ? <p className="mb-4 line-clamp-2 text-sm text-secondary">{c.bio}</p> : null}
              <div className="flex justify-between border-t border-hairline pt-3 text-xs">
                <div>
                  <p className="font-mono uppercase tracking-wider text-muted">Followers</p>
                  <p className="font-semibold text-primary">{(c.followers ?? 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-mono uppercase tracking-wider text-muted">Eng.</p>
                  <p className="font-semibold text-primary">{(c.engagement_rate ?? 0).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="font-mono uppercase tracking-wider text-muted">Match</p>
                  <p className="font-semibold text-violet">{c.match_score ?? "—"}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
