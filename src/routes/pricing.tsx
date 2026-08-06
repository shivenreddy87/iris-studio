import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Project Eros" },
      { name: "description", content: "Plans for brands and creators running influencer campaigns on Project Eros." },
      { property: "og:title", content: "Pricing — Project Eros" },
      { property: "og:description", content: "Plans for brands and creators using Project Eros." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

const TIERS = [
  {
    name: "Studio",
    price: "$0",
    cadence: "for creators, forever",
    features: ["Verified profile & media kit", "Direct brand inbox", "Iris career coaching"],
    cta: "Start free",
  },
  {
    name: "Launch",
    price: "$149",
    cadence: "per brand seat / month",
    features: ["Unlimited campaigns", "Iris matching & drafts", "Deal pipeline & analytics"],
    cta: "Book a consult",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "for teams and agencies",
    features: ["SSO & role permissions", "White-glove onboarding", "Custom Iris workflows"],
    cta: "Talk to sales",
  },
];

function PricingPage() {
  return (
    <div className="hero-dark min-h-screen font-geist text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <Link to="/" className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50 hover:text-foreground">
          ← Back
        </Link>
        <div className="mx-auto mt-10 max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-foreground/50">Pricing</p>
          <h1 className="mt-4 font-display text-5xl font-extrabold tracking-tight md:text-6xl">
            Simple plans. Built to grow with you.
          </h1>
          <p className="mt-4 text-lg text-foreground/60">
            Creators use Project Eros free. Brands only pay when they're ready to run campaigns.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`liquid-glass relative flex flex-col rounded-3xl p-8 ${
                t.featured ? "ring-2 ring-violet/50" : ""
              }`}
            >
              {t.featured ? (
                <span className="absolute right-6 top-6 rounded-full bg-violet/20 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-violet">
                  Most popular
                </span>
              ) : null}
              <h3 className="font-display text-2xl font-bold">{t.name}</h3>
              <div className="mt-4">
                <span className="font-display text-5xl font-extrabold">{t.price}</span>
              </div>
              <p className="mt-1 text-sm text-foreground/60">{t.cadence}</p>
              <ul className="mt-6 space-y-3 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-violet" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                to="/auth/sign-up"
                className={`mt-8 grid place-items-center rounded-full px-5 py-3 text-sm font-semibold transition-opacity hover:opacity-90 ${
                  t.featured
                    ? "bg-foreground text-background"
                    : "border border-white/15 text-foreground"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
