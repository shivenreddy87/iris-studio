import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Home — Project Eros" },
      { name: "description", content: "Your Project Eros workspace." },
      { property: "og:title", content: "Home — Project Eros" },
      { property: "og:description", content: "Your Project Eros workspace." },
    ],
  }),
  component: AppHome,
});

function AppHome() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-10">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-midnight/40">
          Wednesday, July 22
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
          Good afternoon.
        </h1>
      </div>

      <div className="mb-10 rounded-3xl border border-midnight/5 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-midnight">
          <Sparkles className="size-4 text-violet" />
          Ask Iris
        </div>
        <input
          placeholder="e.g. Plan a Diwali campaign for our hydration line, ₹8L budget"
          className="w-full rounded-2xl border border-midnight/10 bg-canvas px-5 py-4 text-base placeholder:text-midnight/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
        />
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {[
            "Find creators for a wellness launch",
            "Draft a brief for micro creators in Delhi",
            "Compare Elena and Aria",
          ].map((s) => (
            <button
              key={s}
              className="rounded-full border border-midnight/10 bg-canvas px-3 py-1.5 font-medium text-midnight/60 hover:border-violet/30 hover:text-violet"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-dashed border-midnight/15 bg-white/50 p-10 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-midnight/40">
          Phase 1 foundation
        </p>
        <h2 className="mt-3 font-display text-2xl font-bold text-midnight">
          Your workspace lives here.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-midnight/60">
          Dashboards, campaign studio, discovery, and Iris ship in the next phases.
        </p>
      </div>
    </div>
  );
}
