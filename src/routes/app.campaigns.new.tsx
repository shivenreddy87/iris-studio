import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Sparkles, Check, ArrowRight, ArrowLeft, Wand2 } from "lucide-react";

export const Route = createFileRoute("/app/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — Project Eros" },
      { name: "description", content: "Compose a campaign brief with Iris." },
      { property: "og:title", content: "New campaign — Project Eros" },
      { property: "og:description", content: "The AI Campaign Studio." },
    ],
  }),
  component: NewCampaign,
});

const steps = [
  { id: "intent", label: "Intent" },
  { id: "audience", label: "Audience" },
  { id: "creators", label: "Creators" },
  { id: "review", label: "Review" },
] as const;

function NewCampaign() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [prompt, setPrompt] = useState("");
  const [budget, setBudget] = useState(50000);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-violet">
          Campaign Studio
        </p>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-midnight">
          Let's build something.
        </h1>
      </div>

      {/* Stepper */}
      <div className="mb-10 flex items-center gap-3">
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.id} className="flex flex-1 items-center gap-3">
              <div
                className={`grid size-8 place-items-center rounded-full text-xs font-bold transition-colors ${
                  done ? "bg-violet text-white" : active ? "bg-midnight text-white" : "bg-midnight/5 text-midnight/40"
                }`}
              >
                {done ? <Check className="size-4" /> : i + 1}
              </div>
              <div className={`text-sm font-medium ${active ? "text-midnight" : "text-midnight/50"}`}>{s.label}</div>
              {i < steps.length - 1 ? <div className="h-px flex-1 bg-midnight/10" /> : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-midnight/5 bg-white p-8 shadow-sm min-h-[420px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 ? (
              <div>
                <div className="mb-6 flex items-center gap-2 text-violet">
                  <Sparkles className="size-4" />
                  <span className="font-mono text-xs uppercase tracking-widest">Tell Iris the vibe</span>
                </div>
                <h2 className="mb-2 font-display text-2xl font-bold text-midnight">What are we launching?</h2>
                <p className="mb-6 text-midnight/60">
                  One paragraph. Iris will draft the brief, audience, and creator shortlist.
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  placeholder="e.g. Launch our new hydration serum for a South Asian audience during Diwali. Budget ~$8k. Warm, ritualistic tone."
                  className="w-full rounded-2xl border border-midnight/10 bg-canvas p-5 text-base placeholder:text-midnight/40 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
                />
                <button className="mt-4 inline-flex items-center gap-2 rounded-full border border-violet/20 bg-violet/5 px-4 py-2 text-sm font-semibold text-violet hover:bg-violet/10">
                  <Wand2 className="size-4" />
                  Suggest me a prompt
                </button>
              </div>
            ) : step === 1 ? (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold text-midnight">Who are we speaking to?</h2>
                <p className="mb-6 text-midnight/60">Iris drafted this from your brief. Refine anything.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Regions" value="India, US-South Asian diaspora" />
                  <Field label="Age" value="22 – 38" />
                  <Field label="Interests" value="Beauty, wellness rituals, festivals" />
                  <Field label="Platforms" value="Instagram, YouTube Shorts" />
                </div>
                <div className="mt-6">
                  <label className="mb-2 block text-sm font-medium text-midnight">Budget: ${budget.toLocaleString()}</label>
                  <input
                    type="range"
                    min={5000}
                    max={250000}
                    step={1000}
                    value={budget}
                    onChange={(e) => setBudget(+e.target.value)}
                    className="w-full accent-violet"
                  />
                </div>
              </div>
            ) : step === 2 ? (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold text-midnight">Iris shortlisted 6 creators.</h2>
                <p className="mb-6 text-midnight/60">Match scores based on brief, audience, and past performance.</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    { n: "Maya Sharma", m: 96, r: "320k · Mumbai" },
                    { n: "Aria Vance", m: 95, r: "85k · London" },
                    { n: "Elena Rossi", m: 92, r: "240k · Milan" },
                    { n: "Nia Okafor", m: 88, r: "190k · Lagos" },
                  ].map((c) => (
                    <label key={c.n} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-midnight/10 bg-canvas p-4 hover:border-violet/30">
                      <input type="checkbox" defaultChecked className="size-4 rounded accent-violet" />
                      <div className="size-10 rounded-full bg-gradient-to-tr from-violet to-rose" />
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-midnight">{c.n}</div>
                        <div className="text-xs text-midnight/50">{c.r}</div>
                      </div>
                      <div className="rounded-full bg-violet/10 px-2 py-1 text-xs font-bold text-violet">{c.m}%</div>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 className="mb-2 font-display text-2xl font-bold text-midnight">Ready to launch.</h2>
                <p className="mb-6 text-midnight/60">Iris will send outreach with tailored notes for each creator.</p>
                <dl className="divide-y divide-midnight/10 rounded-2xl border border-midnight/10 bg-canvas">
                  {[
                    ["Campaign", "Diwali Hydration Launch"],
                    ["Budget", `$${budget.toLocaleString()}`],
                    ["Creators shortlisted", "4"],
                    ["Estimated reach", "735k"],
                    ["Timeline", "Oct 10 – Nov 5, 2026"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between px-5 py-3.5 text-sm">
                      <dt className="text-midnight/60">{k}</dt>
                      <dd className="font-semibold text-midnight">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => (step === 0 ? navigate({ to: "/app/campaigns" }) : setStep(step - 1))}
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-midnight/60 hover:text-midnight"
        >
          <ArrowLeft className="size-4" />
          {step === 0 ? "Cancel" : "Back"}
        </button>
        <button
          onClick={() => (step === steps.length - 1 ? navigate({ to: "/app/campaigns" }) : setStep(step + 1))}
          className="inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-midnight/20 hover:bg-violet"
        >
          {step === steps.length - 1 ? "Launch campaign" : "Continue"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-widest text-midnight/50">{label}</span>
      <input
        defaultValue={value}
        className="w-full rounded-2xl border border-midnight/10 bg-canvas px-4 py-3 text-sm text-midnight focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
      />
    </label>
  );
}
