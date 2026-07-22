import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Sparkles, Camera, ArrowRight } from "lucide-react";
import { z } from "zod";

const searchSchema = z.object({
  role: z.enum(["brand", "creator"]).optional(),
});

export const Route = createFileRoute("/auth/role")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Choose your role — Project Eros" },
      { name: "description", content: "Are you a brand or a creator? Choose how you'll use Iris." },
      { property: "og:title", content: "Choose your role — Project Eros" },
      { property: "og:description", content: "Get started as a Brand or a Creator on Project Eros." },
    ],
  }),
  component: RolePicker,
});

const roles = [
  {
    id: "brand" as const,
    title: "I am a Brand",
    description:
      "Plan campaigns, discover aligned creators, and orchestrate collaborations with Iris as your strategist.",
    features: ["AI Campaign Studio", "Creator match scores", "Deal workspace"],
    Icon: Sparkles,
    accent: "violet" as const,
  },
  {
    id: "creator" as const,
    title: "I am a Creator",
    description:
      "Get matched with brands that value your craft. Iris helps you grow your media kit, negotiate, and level up.",
    features: ["Opportunity marketplace", "Iris growth coach", "Media kit builder"],
    Icon: Camera,
    accent: "rose" as const,
  },
];

function RolePicker() {
  const { role: selected } = useSearch({ from: "/auth/role" });
  const navigate = useNavigate({ from: "/auth/role" });

  return (
    <div className="min-h-screen bg-surface-2 px-6 py-10">
      <Link to="/" className="mx-auto block max-w-6xl font-display text-xl font-extrabold tracking-tighter text-ink">
        EROS.
      </Link>

      <div className="mx-auto mt-16 max-w-6xl">
        <div className="mb-14 text-center">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-ink-mute">Step 1 of 3</p>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink md:text-5xl">
            How will you use Eros?
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-ink-dim">
            Pick your path. You can always join the other side later.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {roles.map(({ id, title, description, features, Icon, accent }) => {
            const isSelected = selected === id;
            const accentBg = accent === "violet" ? "bg-violet" : "bg-rose";
            const accentText = accent === "violet" ? "text-violet" : "text-rose";
            const accentGlow =
              accent === "violet" ? "bg-violet/10" : "bg-rose/10";

            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => navigate({ search: { role: id } })}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-3xl border bg-surface-2 p-8 text-left transition-all ${
                  isSelected
                    ? "border-violet shadow-2xl shadow-violet/20"
                    : "border-hairline hover:border-hairline hover:shadow-xl"
                }`}
              >
                <div className={`pointer-events-none absolute -right-16 -top-16 size-56 rounded-full blur-3xl ${accentGlow}`} />
                <div className="relative">
                  <div className={`mb-8 grid size-14 place-items-center rounded-2xl ${accentBg} text-white shadow-lg`}>
                    <Icon className="size-7" strokeWidth={2} />
                  </div>
                  <h2 className="mb-3 font-display text-2xl font-extrabold text-ink">{title}</h2>
                  <p className="mb-6 leading-relaxed text-ink-dim">{description}</p>
                  <ul className="mb-8 space-y-2 text-sm text-ink-dim">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className={`size-1.5 rounded-full ${accentBg}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className={`flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-widest ${accentText}`}>
                    {isSelected ? "Selected" : "Choose this path"}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-12 flex justify-center">
          <Link
            to="/auth/sign-up"
            search={{ role: selected }}
            disabled={!selected}
            className={`rounded-full px-10 py-4 text-sm font-semibold shadow-lg transition-all ${
              selected
                ? "bg-midnight text-white shadow-midnight/20 hover:bg-violet"
                : "cursor-not-allowed bg-surface-2/10 text-ink-mute"
            }`}
            onClick={(e) => {
              if (!selected) e.preventDefault();
            }}
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  );
}
