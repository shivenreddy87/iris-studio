import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav, SiteFooter } from "@/components/layout/site-nav";
import { Reveal, Stagger } from "@/components/motion/reveal";
import { motion } from "motion/react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Eros — Influencer marketing, orchestrated by intelligence" },
      {
        name: "description",
        content:
          "Plan campaigns, discover the right creators, and collaborate with Iris — your embedded AI marketing strategist.",
      },
      { property: "og:title", content: "Project Eros — Influencer marketing, orchestrated by intelligence" },
      {
        property: "og:description",
        content: "The AI Operating System for influencer marketing. Meet Iris.",
      },
    ],
  }),
  component: LandingPage,
});

const creators = [
  { name: "Elena Rossi", niche: "Minimalist Fashion • Milan", reach: "240k", match: 98, accent: "violet" as const },
  { name: "Julian Chen", niche: "Tech & Design • SF", reach: "1.1M", match: 92, accent: "rose" as const },
  { name: "Aria Vance", niche: "Wellness • London", reach: "85k", match: 95, accent: "violet" as const },
];

function LandingPage() {
  return (
    <div className="bg-canvas text-ink">
      <SiteNav />

      {/* Hero */}
      <section className="relative overflow-hidden px-6 pb-32 pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet/10 bg-violet/5 px-3 py-1 font-mono text-xs text-violet">
              <span className="size-1.5 animate-pulse rounded-full bg-violet" />
              IRIS INTELLIGENCE v2.0
            </div>
            <h1 className="mb-8 font-display text-5xl font-extrabold leading-[1.05] tracking-tight text-midnight lg:text-7xl">
              Influencer marketing,{" "}
              <span className="bg-gradient-to-r from-violet to-rose bg-clip-text text-transparent">
                orchestrated
              </span>{" "}
              by intelligence.
            </h1>
            <p className="mb-10 max-w-[48ch] text-xl leading-relaxed text-midnight/60">
              Plan campaigns, discover the right creators, and collaborate with Iris — your embedded AI strategist guiding every step.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/auth/role"
                search={{ role: "brand" }}
                className="rounded-full bg-midnight px-8 py-4 text-lg font-medium text-white shadow-xl shadow-midnight/20 transition-transform hover:bg-violet active:scale-[0.98]"
              >
                Start as Brand
              </Link>
              <Link
                to="/auth/role"
                search={{ role: "creator" }}
                className="rounded-full border border-midnight/10 bg-white px-8 py-4 text-lg font-medium text-midnight transition-colors hover:bg-midnight/5"
              >
                I am a Creator
              </Link>
            </div>
          </Reveal>

          {/* Iris Interface Mockup */}
          <Reveal delay={0.15}>
            <div className="relative">
              <div className="relative z-10 rounded-3xl border border-midnight/5 bg-white p-6 shadow-2xl">
                <div className="mb-6 flex items-center gap-2 border-b border-midnight/5 pb-4">
                  <div className="grid size-8 place-items-center rounded-full bg-gradient-to-tr from-violet to-rose text-[10px] font-bold text-white">
                    IR
                  </div>
                  <span className="text-sm font-semibold text-midnight">Iris Strategist</span>
                </div>
                <div className="space-y-4 font-mono text-sm leading-relaxed text-midnight/80">
                  <p className="text-violet">&gt; Analyzing audience alignment for 'Everglow Skincare'...</p>
                  <div className="animate-stream border-l-2 border-rose py-1 pl-3">
                    I recommend prioritizing nano-influencers in the sustainability niche. Expected ROI: 4.2x.
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-midnight/5 bg-canvas p-3">
                      <div className="mb-1 text-[10px] uppercase tracking-widest text-midnight/40">Reach</div>
                      <div className="text-lg font-bold text-midnight">1.2M+</div>
                    </div>
                    <div className="rounded-lg border border-midnight/5 bg-canvas p-3">
                      <div className="mb-1 text-[10px] uppercase tracking-widest text-midnight/40">Sentiment</div>
                      <div className="font-display text-lg font-bold text-midnight">94% Positive</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -right-6 -top-6 size-48 rounded-full bg-rose/10 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-10 -left-10 size-64 rounded-full bg-violet/10 blur-3xl" />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-midnight/5 bg-white/50 py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-8 px-6 opacity-40 grayscale">
          {["Vogue", "Estée", "Glossier", "Shopify", "Sephora"].map((brand) => (
            <span key={brand} className="font-display text-2xl font-extrabold uppercase tracking-tighter">
              {brand}
            </span>
          ))}
        </div>
      </section>

      {/* Creator Discovery Preview */}
      <section id="creators" className="bg-white py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="mb-4 font-display text-4xl font-extrabold tracking-tight text-midnight">
                Precise Matching. Zero Guesswork.
              </h2>
              <p className="text-lg text-midnight/60">
                Iris processes over 50 data points per creator to find your perfect brand counterpart.
              </p>
            </div>
            <button className="group flex items-center gap-2 font-semibold text-violet underline decoration-violet/30 underline-offset-4">
              Explore Discover Engine
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>

          <Stagger className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {creators.map((c, i) => (
              <motion.div
                key={c.name}
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
                }}
                whileHover={{ y: -4 }}
                className="group overflow-hidden rounded-3xl border border-midnight/5 bg-canvas transition-shadow hover:shadow-2xl"
              >
                <div className="relative">
                  <div
                    className="grid aspect-[4/5] w-full place-items-center bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${
                        i === 0 ? "#F0647D22, #7657FF22" : i === 1 ? "#7657FF22, #171A2B44" : "#F0647D22, #F7F7FB"
                      })`,
                    }}
                  >
                    <span className="font-display text-6xl font-extrabold text-midnight/10">
                      {c.name.split(" ").map((s) => s[0]).join("")}
                    </span>
                  </div>
                  <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-midnight backdrop-blur">
                    <span className={`size-2 rounded-full ${c.accent === "violet" ? "bg-violet" : "bg-rose"}`} />
                    {c.match}% IRIS MATCH
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <h3 className="font-display text-lg font-bold text-midnight">{c.name}</h3>
                      <p className="text-xs uppercase tracking-widest text-midnight/40">{c.niche}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${c.accent === "violet" ? "text-violet" : "text-rose"}`}>
                        {c.reach}
                      </div>
                      <div className="text-[10px] text-midnight/40">Reach</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Split experience */}
      <section id="platform" className="grid md:grid-cols-2">
        <div className="relative flex flex-col justify-center overflow-hidden bg-midnight p-16 text-white lg:p-24">
          <div className="relative z-10 max-w-md">
            <h3 className="mb-6 font-display text-4xl font-extrabold">For Brands.</h3>
            <p className="mb-10 text-lg leading-relaxed text-white/60">
              Automate discovery, negotiate in bulk, and track performance with the precision of a quantitative fund.
            </p>
            <Link
              to="/auth/role"
              search={{ role: "brand" }}
              className="inline-block rounded-full border border-white/20 px-8 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
            >
              Explore Brand Tools
            </Link>
          </div>
          <div className="pointer-events-none absolute -bottom-20 -right-20 size-80 rounded-full bg-violet/20 blur-[120px]" />
        </div>
        <div className="relative flex flex-col justify-center overflow-hidden bg-violet p-16 text-white lg:p-24">
          <div className="relative z-10 max-w-md">
            <h3 className="mb-6 font-display text-4xl font-extrabold">For Creators.</h3>
            <p className="mb-10 text-lg leading-relaxed text-white/80">
              Get matched with brands that actually value your craft. Iris helps you negotiate and grow your media kit.
            </p>
            <Link
              to="/auth/role"
              search={{ role: "creator" }}
              className="inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-violet shadow-xl"
            >
              Join the Network
            </Link>
          </div>
          <div className="pointer-events-none absolute -left-20 -top-20 size-80 rounded-full bg-rose/30 blur-[120px]" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
