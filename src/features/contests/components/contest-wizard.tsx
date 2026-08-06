import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Check, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/features/profiles/components/field";
import { AttachmentUpload } from "@/features/campaign-requests/components/attachment-preview";
import { INFLUENCER_CATEGORIES, PRIMARY_PLATFORMS } from "@/features/campaign-requests/types";
import { contestPublishSchema, type ContestFormInput } from "../contest.schema";
import { publishContest, updateDraftContest } from "../contest.functions";
import { useInvalidateContest } from "../hooks/use-contests";
import { isDraft, type Contest } from "../types";

const STEPS = [
  "Campaign information",
  "Eligibility",
  "Rewards",
  "Timeline",
  "Rules",
  "Review",
] as const;

function str(value: string | number | null | undefined) {
  return value === null || value === undefined ? "" : String(value);
}

function dateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toValues(contest: Contest): ContestFormInput {
  return {
    title: contest.title,
    description: str(contest.description),
    campaignGoal: str(contest.campaignGoal),
    businessCategory: str(contest.businessCategory),
    attachmentUrl: str(contest.attachmentUrl),
    preferredCreatorCategory: str(contest.preferredCreatorCategory),
    minimumFollowers: str(contest.minimumFollowers),
    maximumFollowers: str(contest.maximumFollowers),
    targetLocation: str(contest.targetLocation),
    targetPlatform: str(contest.targetPlatform),
    rewardPool: str(contest.rewardPool),
    winnerCount: str(contest.winnerCount),
    participantLimit: str(contest.participantLimit),
    requiredViews: str(contest.requiredViews),
    applicationStartDate: dateInput(contest.applicationStartDate),
    applicationDeadline: dateInput(contest.applicationDeadline),
    contestStartDate: dateInput(contest.contestStartDate),
    contestEndDate: dateInput(contest.contestEndDate),
    contestBrief: str(contest.contestBrief),
    contestRules: str(contest.contestRules),
  };
}

/**
 * Six-step contest wizard. Draft saves are lenient; publishing runs the strict
 * schema on the client first so errors land on the right field.
 */
export function ContestWizard({ contest }: { contest: Contest }) {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const invalidate = useInvalidateContest();
  const inherited = isDraft(contest.status);

  const form = useForm<ContestFormInput>({ defaultValues: toValues(contest) });
  const { register, setError, clearErrors, getValues, watch, setValue } = form;
  const errors = form.formState.errors;

  const saveFn = useServerFn(updateDraftContest);
  const publishFn = useServerFn(publishContest);

  const save = useMutation({
    mutationFn: () => saveFn({ data: { id: contest.id, values: getValues() } }),
    onSuccess: () => {
      toast.success("Draft saved");
      invalidate(contest.id);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const publish = useMutation({
    mutationFn: () => publishFn({ data: { id: contest.id, values: getValues() } }),
    onSuccess: () => {
      toast.success("Contest published");
      invalidate(contest.id);
      void navigate({ to: "/app/admin/contests/$contestId", params: { contestId: contest.id } });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function attemptPublish() {
    clearErrors();
    const result = contestPublishSchema.safeParse(getValues());
    if (!result.success) {
      for (const issue of (result.error as z.ZodError).issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          setError(path as keyof ContestFormInput, { message: issue.message });
        }
      }
      toast.error("Fix the highlighted fields before publishing");
      return;
    }
    publish.mutate();
  }

  const err = (key: keyof ContestFormInput) => errors[key]?.message as string | undefined;

  return (
    <div className="space-y-6">
      <ol className="flex flex-wrap gap-2">
        {STEPS.map((label, index) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => setStep(index)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                index === step
                  ? "border-violet bg-violet/15 text-ink"
                  : "border-hairline text-ink-mute hover:text-ink"
              }`}
            >
              {index + 1}. {label}
            </button>
          </li>
        ))}
      </ol>

      <form className="space-y-6" onSubmit={(event) => event.preventDefault()}>
        {step === 0 ? (
          <StepCard
            title="Campaign information"
            description={
              inherited
                ? "Inherited from the approved campaign request. Editable while the contest is a draft."
                : "Inherited fields are locked once the contest is published."
            }
          >
            <Field label="Contest title" htmlFor="title" error={err("title")}>
              <input id="title" className={fieldClass} disabled={!inherited} {...register("title")} />
            </Field>
            <Field label="Business category" htmlFor="businessCategory" optional>
              <input
                id="businessCategory"
                className={fieldClass}
                disabled={!inherited}
                {...register("businessCategory")}
              />
            </Field>
            <Field label="Campaign goal" htmlFor="campaignGoal" optional>
              <input
                id="campaignGoal"
                className={fieldClass}
                disabled={!inherited}
                {...register("campaignGoal")}
              />
            </Field>
            <Field label="Description" htmlFor="description" optional className="sm:col-span-2">
              <textarea
                id="description"
                rows={5}
                className={fieldClass}
                disabled={!inherited}
                {...register("description")}
              />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium text-ink">Attachment</p>
              <AttachmentUpload
                value={watch("attachmentUrl") ?? ""}
                onChange={(path) => setValue("attachmentUrl", path)}
              />
            </div>
          </StepCard>
        ) : null}

        {step === 1 ? (
          <StepCard title="Eligibility" description="Who is allowed to enter this contest.">
            <Field label="Creator category" htmlFor="preferredCreatorCategory" optional>
              <select
                id="preferredCreatorCategory"
                className={fieldClass}
                {...register("preferredCreatorCategory")}
              >
                <option value="">Any category</option>
                {INFLUENCER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Platform" htmlFor="targetPlatform" error={err("targetPlatform")}>
              <select id="targetPlatform" className={fieldClass} {...register("targetPlatform")}>
                <option value="">Select a platform</option>
                {PRIMARY_PLATFORMS.map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Minimum followers" htmlFor="minimumFollowers" optional>
              <input
                id="minimumFollowers"
                type="number"
                min={0}
                className={fieldClass}
                {...register("minimumFollowers")}
              />
            </Field>
            <Field
              label="Maximum followers"
              htmlFor="maximumFollowers"
              optional
              error={err("maximumFollowers")}
            >
              <input
                id="maximumFollowers"
                type="number"
                min={0}
                className={fieldClass}
                {...register("maximumFollowers")}
              />
            </Field>
            <Field label="Location" htmlFor="targetLocation" optional>
              <input id="targetLocation" className={fieldClass} {...register("targetLocation")} />
            </Field>
          </StepCard>
        ) : null}

        {step === 2 ? (
          <StepCard title="Rewards" description="Reward pool, winners and participation limits.">
            <Field label="Reward pool (₹)" htmlFor="rewardPool" error={err("rewardPool")}>
              <input
                id="rewardPool"
                type="number"
                min={0}
                className={fieldClass}
                {...register("rewardPool")}
              />
            </Field>
            <Field label="Number of winners" htmlFor="winnerCount" error={err("winnerCount")}>
              <input
                id="winnerCount"
                type="number"
                min={1}
                className={fieldClass}
                {...register("winnerCount")}
              />
            </Field>
            <Field
              label="Maximum participants"
              htmlFor="participantLimit"
              error={err("participantLimit")}
            >
              <input
                id="participantLimit"
                type="number"
                min={1}
                className={fieldClass}
                {...register("participantLimit")}
              />
            </Field>
            <Field label="Required views" htmlFor="requiredViews" optional>
              <input
                id="requiredViews"
                type="number"
                min={0}
                className={fieldClass}
                {...register("requiredViews")}
              />
            </Field>
          </StepCard>
        ) : null}

        {step === 3 ? (
          <StepCard title="Timeline" description="Application window and contest run dates.">
            <Field
              label="Applications open"
              htmlFor="applicationStartDate"
              error={err("applicationStartDate")}
            >
              <input
                id="applicationStartDate"
                type="date"
                className={fieldClass}
                {...register("applicationStartDate")}
              />
            </Field>
            <Field
              label="Applications close"
              htmlFor="applicationDeadline"
              error={err("applicationDeadline")}
            >
              <input
                id="applicationDeadline"
                type="date"
                className={fieldClass}
                {...register("applicationDeadline")}
              />
            </Field>
            <Field
              label="Contest starts"
              htmlFor="contestStartDate"
              error={err("contestStartDate")}
            >
              <input
                id="contestStartDate"
                type="date"
                className={fieldClass}
                {...register("contestStartDate")}
              />
            </Field>
            <Field label="Contest ends" htmlFor="contestEndDate" error={err("contestEndDate")}>
              <input
                id="contestEndDate"
                type="date"
                className={fieldClass}
                {...register("contestEndDate")}
              />
            </Field>
          </StepCard>
        ) : null}

        {step === 4 ? (
          <StepCard title="Rules" description="What participants must deliver, and how they win.">
            <Field
              label="Contest brief"
              htmlFor="contestBrief"
              error={err("contestBrief")}
              className="sm:col-span-2"
            >
              <textarea id="contestBrief" rows={6} className={fieldClass} {...register("contestBrief")} />
            </Field>
            <Field
              label="Contest rules"
              htmlFor="contestRules"
              error={err("contestRules")}
              className="sm:col-span-2"
            >
              <textarea id="contestRules" rows={6} className={fieldClass} {...register("contestRules")} />
            </Field>
          </StepCard>
        ) : null}

        {step === 5 ? (
          <StepCard
            title="Review"
            description="Confirm everything below, then publish to notify the business."
          >
            <div className="sm:col-span-2">
              <ReviewList values={getValues()} />
            </div>
          </StepCard>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <ArrowLeft className="size-4" /> Back
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              <Save className="size-4" /> Save draft
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
                Next <ArrowRight className="size-4" />
              </Button>
            ) : inherited ? (
              <Button type="button" disabled={publish.isPending} onClick={attemptPublish}>
                <Check className="size-4" /> Publish contest
              </Button>
            ) : null}
          </div>
        </div>
      </form>
    </div>
  );
}

function StepCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="mb-5 mt-1 text-sm text-ink-dim">{description}</p>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ReviewList({ values }: { values: ContestFormInput }) {
  const rows: Array<[string, string | number | undefined]> = [
    ["Title", values.title],
    ["Platform", values.targetPlatform],
    ["Creator category", values.preferredCreatorCategory],
    ["Followers", `${values.minimumFollowers || "—"} – ${values.maximumFollowers || "—"}`],
    ["Reward pool", values.rewardPool],
    ["Winners", values.winnerCount],
    ["Maximum participants", values.participantLimit],
    ["Required views", values.requiredViews],
    ["Applications", `${values.applicationStartDate || "—"} → ${values.applicationDeadline || "—"}`],
    ["Contest", `${values.contestStartDate || "—"} → ${values.contestEndDate || "—"}`],
  ];
  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="border-b border-hairline py-3">
          <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
          <dd className="mt-1 text-sm text-ink">
            {value === undefined || value === "" ? "—" : String(value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
