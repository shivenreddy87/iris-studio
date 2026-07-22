import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { z } from "zod";
import { creatorsApi } from "@/lib/api/adapters";

const searchSchema = z.object({ q: z.string().optional() });

const creatorsQuery = (q: string) =>
  queryOptions({
    queryKey: ["creators", q],
    queryFn: () => creatorsApi.search(q),
  });

export const Route = createFileRoute("/app/discover")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q ?? "" }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(creatorsQuery(deps.q)),
  head: () => ({
    meta: [
      { title: "Discover creators — Project Eros" },
      { name: "description", content: "Search a curated universe of creators, ranked by Iris." },
      { property: "og:title", content: "Discover creators — Project Eros" },
      { property: "og:description", content: "Iris-ranked creator discovery." },
    ],
  }),
  component: Discover,
});

function Discover() {
  const { q = "" } = useSearch({ from: "/app/discover" });
  const navigate = useNavigate({ from: "/app/discover" });
  const { data } = useSuspenseQuery(creatorsQuery(q));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-midnight/40">Discover</p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
          Find the perfect voice.
        </h1>
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-midnight/40" />
          <input
            value={q}
            onChange={(e) => navigate({ search: { q: e.target.value || undefined } })}
            placeholder="Ask like a human — 'wellness creators in London under 100k'"
            className="w-full rounded-full border border-midnight/10 bg-white py-3.5 pl-11 pr-4 text-sm placeholder:text-midnight/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
          />
        </div>
        <button className="inline-flex items-center gap-2 rounded-full border border-midnight/10 bg-white px-5 py-3 text-sm font-semibold text-midnight hover:bg-canvas">
          <SlidersHorizontal className="size-4" /> Filters
        </button>
        <button className="inline-flex items-center gap-2 rounded-full bg-violet px-5 py-3 text-sm font-semibold text-white hover:bg-midnight">
          <Sparkles className="size-4" /> Ask Iris
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2 text-xs">
        {["Beauty", "Wellness", "Fashion", "Tech", "Fitness", "Food", "Micro (<100k)", "India", "US"].map((t) => (
          <button
            key={t}
            className="rounded-full border border-midnight/10 bg-white px-3 py-1.5 font-medium text-midnight/60 hover:border-violet/30 hover:text-violet"
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((c) => (
          <Link
            key={c.id}
            to="/app/creators/$id"
            params={{ id: c.id }}
            className="group relative overflow-hidden rounded-3xl border border-midnight/5 bg-white p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className={`pointer-events-none absolute -right-10 -top-10 size-40 rounded-full blur-3xl ${
                c.accent === "violet" ? "bg-violet/10" : "bg-rose/10"
              }`}
            />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className={`size-14 rounded-2xl bg-gradient-to-tr ${c.accent === "violet" ? "from-violet to-midnight" : "from-rose to-violet"}`} />
                <div className="rounded-full bg-midnight px-2.5 py-1 text-xs font-bold text-white">
                  {c.matchScore}%
                </div>
              </div>
              <div className="mt-4 font-display text-lg font-bold text-midnight">{c.name}</div>
              <div className="text-xs text-midnight/50">{c.handle} · {c.location}</div>
              <p className="mt-3 line-clamp-2 text-sm text-midnight/60">{c.bio}</p>
              <div className="mt-4 flex items-center justify-between border-t border-midnight/5 pt-4 text-xs">
                <div>
                  <div className="font-semibold text-midnight">{(c.followers / 1000).toFixed(0)}k</div>
                  <div className="text-midnight/40">followers</div>
                </div>
                <div>
                  <div className="font-semibold text-midnight">{c.engagementRate}%</div>
                  <div className="text-midnight/40">ER</div>
                </div>
                <div>
                  <div className="font-semibold text-midnight">${c.price.toLocaleString()}</div>
                  <div className="text-midnight/40">avg rate</div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
