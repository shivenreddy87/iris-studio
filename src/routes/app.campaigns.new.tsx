import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { createCampaign } from "@/lib/campaigns.functions";
import { ensureOrganization } from "@/lib/org.functions";

export const Route = createFileRoute("/app/campaigns/new")({
  head: () => ({
    meta: [
      { title: "New campaign — Project Eros" },
      { name: "description", content: "Compose a campaign with Iris." },
    ],
  }),
  component: NewCampaignPage,
});

function NewCampaignPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createFn = useServerFn(createCampaign);
  const ensureOrg = useServerFn(ensureOrganization);

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState<string>("500000");
  const [audience, setAudience] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const org = await ensureOrg();
      return createFn({
        data: {
          org_id: org.id,
          name,
          brief,
          budget: Number(budget) || 0,
          audience_notes: audience || undefined,
        },
      });
    },
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast.success("Campaign created");
      navigate({ to: "/app/campaigns/$id", params: { id: c.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const steps = [
    {
      label: "Name",
      content: (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Diwali Hydration Launch"
          className="w-full rounded-2xl border border-hairline bg-surface-2 px-5 py-4 text-lg placeholder:text-ink-mute focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
        />
      ),
      canNext: name.length >= 2,
    },
    {
      label: "Brief",
      content: (
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="What are you launching? What story do you want creators to tell?"
          rows={6}
          className="w-full rounded-2xl border border-hairline bg-surface-2 px-5 py-4 text-base placeholder:text-ink-mute focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
        />
      ),
      canNext: brief.length >= 10,
    },
    {
      label: "Budget",
      content: (
        <div>
          <div className="mb-2 font-mono text-xs uppercase tracking-widest text-ink-mute">INR (₹)</div>
          <input
            type="number"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-2xl border border-hairline bg-surface-2 px-5 py-4 text-lg focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
          />
        </div>
      ),
      canNext: Number(budget) > 0,
    },
    {
      label: "Audience",
      content: (
        <textarea
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g. Metro women 22–35 interested in fitness and clean beauty"
          rows={4}
          className="w-full rounded-2xl border border-hairline bg-surface-2 px-5 py-4 text-base placeholder:text-ink-mute focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
        />
      ),
      canNext: true,
    },
  ];

  const current = steps[step];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-tr from-violet to-rose text-white">
          <Sparkles className="size-5" />
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-mute">
            Step {step + 1} of {steps.length}
          </p>
          <h1 className="font-display text-3xl font-extrabold text-ink">
            Compose with Iris
          </h1>
        </div>
      </div>

      <div className="mb-8 flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-violet" : "bg-surface-2/10"}`}
          />
        ))}
      </div>

      <div className="rounded-3xl border border-hairline bg-surface-2 p-8 shadow-sm">
        <label className="mb-3 block font-display text-lg font-bold text-ink">
          {current.label}
        </label>
        {current.content}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm font-semibold text-ink-mute hover:text-ink disabled:opacity-40"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!current.canNext}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending || !current.canNext}
              className="inline-flex items-center gap-2 rounded-full bg-midnight px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet disabled:opacity-40"
            >
              {mutation.isPending ? "Creating…" : "Create campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
