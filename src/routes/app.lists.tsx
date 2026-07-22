import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { Plus, Users } from "lucide-react";
import { listsApi } from "@/lib/api/adapters";

const listsQuery = queryOptions({ queryKey: ["lists"], queryFn: () => listsApi.list() });

export const Route = createFileRoute("/app/lists")({
  head: () => ({
    meta: [
      { title: "Creator lists — Project Eros" },
      { name: "description", content: "Curated rosters you can invoke anytime." },
      { property: "og:title", content: "Creator lists — Project Eros" },
      { property: "og:description", content: "Curated rosters of creators." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listsQuery),
  component: ListsPage,
});

function ListsPage() {
  const { data } = useSuspenseQuery(listsQuery);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-midnight/40">Creator lists</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
            Your rosters, ready to go.
          </h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-midnight px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-midnight/20 hover:bg-violet">
          <Plus className="size-4" /> New list
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((l) => (
          <div
            key={l.id}
            className="group relative overflow-hidden rounded-3xl border border-midnight/5 bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
          >
            <div
              className={`pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl ${
                l.accent === "violet" ? "bg-violet/10" : "bg-rose/10"
              }`}
            />
            <div className="relative">
              <div className={`grid size-12 place-items-center rounded-2xl ${l.accent === "violet" ? "bg-violet" : "bg-rose"} text-white`}>
                <Users className="size-5" />
              </div>
              <h3 className="mt-5 font-display text-lg font-bold text-midnight">{l.name}</h3>
              <div className="mt-1 text-sm text-midnight/50">{l.count} creators · updated {l.updated}</div>
              <div className="mt-6 flex -space-x-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="size-8 rounded-full border-2 border-white bg-gradient-to-tr from-violet to-rose" />
                ))}
                <div className="grid size-8 place-items-center rounded-full border-2 border-white bg-canvas text-xs font-semibold text-midnight/60">
                  +{l.count - 5}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
