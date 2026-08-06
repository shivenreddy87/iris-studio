import { useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "@/features/profiles/components/field";
import { AttachmentUpload } from "./attachment-preview";
import {
  BUSINESS_CATEGORIES,
  CAMPAIGN_GOALS,
  INFLUENCER_CATEGORIES,
  PRIMARY_PLATFORMS,
  campaignRequestDraftSchema,
  campaignRequestSubmitSchema,
  type CampaignRequest,
} from "../types";

export type CampaignRequestFormValues = {
  title: string;
  businessCategory: string;
  campaignGoal: string;
  campaignDescription: string;
  targetAudience: string;
  targetLocation: string;
  targetPlatform: string;
  requiredViews: string;
  budget: string;
  durationDays: string;
  preferredCreatorCategory: string;
  minimumFollowers: string;
  maximumFollowers: string;
  attachmentUrl: string;
};

export type CampaignRequestPayload = {
  title: string;
  businessCategory?: string;
  campaignGoal?: string;
  campaignDescription?: string;
  targetAudience?: string;
  targetLocation?: string;
  targetPlatform?: string;
  requiredViews?: number;
  budget?: number;
  durationDays?: number;
  preferredCreatorCategory?: string;
  minimumFollowers?: number;
  maximumFollowers?: number;
  attachmentUrl?: string;
};

function num(value: string): number | undefined {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function toPayload(values: CampaignRequestFormValues): CampaignRequestPayload {
  return {
    title: values.title,
    businessCategory: values.businessCategory,
    campaignGoal: values.campaignGoal,
    campaignDescription: values.campaignDescription,
    targetAudience: values.targetAudience,
    targetLocation: values.targetLocation,
    targetPlatform: values.targetPlatform,
    requiredViews: num(values.requiredViews),
    budget: num(values.budget),
    durationDays: num(values.durationDays),
    preferredCreatorCategory: values.preferredCreatorCategory,
    minimumFollowers: num(values.minimumFollowers),
    maximumFollowers: num(values.maximumFollowers),
    attachmentUrl: values.attachmentUrl || undefined,
  };
}

function Section({
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
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-dim">{description}</p>
      <div className="mt-6 grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function CampaignRequestForm({
  userId,
  defaultValues,
  saving,
  onSaveDraft,
  onSubmitRequest,
}: {
  userId: string;
  defaultValues?: CampaignRequest | null;
  saving?: boolean;
  onSaveDraft: (values: CampaignRequestPayload) => Promise<void>;
  onSubmitRequest: (values: CampaignRequestPayload) => Promise<void>;
}) {
  const modeRef = useRef<"draft" | "submit">("draft");

  const resolver: Resolver<CampaignRequestFormValues> = (values, ctx, options) => {
    const schema =
      modeRef.current === "submit" ? campaignRequestSubmitSchema : campaignRequestDraftSchema;
    const zr = zodResolver(schema as never) as unknown as Resolver<CampaignRequestFormValues>;
    return zr(values, ctx, options);
  };

  const { register, handleSubmit, formState, setValue, watch } = useForm<CampaignRequestFormValues>(
    {
      resolver,
      defaultValues: {
        title: defaultValues?.title ?? "",
        businessCategory: defaultValues?.businessCategory ?? "",
        campaignGoal: defaultValues?.campaignGoal ?? "",
        campaignDescription: defaultValues?.campaignDescription ?? "",
        targetAudience: defaultValues?.targetAudience ?? "",
        targetLocation: defaultValues?.targetLocation ?? "",
        targetPlatform: defaultValues?.targetPlatform ?? "",
        requiredViews: defaultValues?.requiredViews?.toString() ?? "",
        budget: defaultValues?.budget?.toString() ?? "",
        durationDays: defaultValues?.durationDays?.toString() ?? "",
        preferredCreatorCategory: defaultValues?.preferredCreatorCategory ?? "",
        minimumFollowers: defaultValues?.minimumFollowers?.toString() ?? "",
        maximumFollowers: defaultValues?.maximumFollowers?.toString() ?? "",
        attachmentUrl: defaultValues?.attachmentUrl ?? "",
      },
    },
  );

  const errors = formState.errors;
  const attachmentUrl = watch("attachmentUrl");

  const run = (mode: "draft" | "submit") => {
    modeRef.current = mode;
    return handleSubmit(async (values) => {
      const payload = toPayload(values);
      if (mode === "submit") await onSubmitRequest(payload);
      else await onSaveDraft(payload);
    });
  };

  return (
    <form className="space-y-6" onSubmit={(e) => void run("submit")(e)}>
      <Section title="Campaign basics" description="What the campaign is and who it is for.">
        <Field label="Campaign title" htmlFor="title" error={errors.title?.message}>
          <input
            id="title"
            className={fieldClass}
            placeholder="Summer collection launch"
            {...register("title")}
          />
        </Field>

        <Field
          label="Business category"
          htmlFor="businessCategory"
          error={errors.businessCategory?.message}
        >
          <select id="businessCategory" className={fieldClass} {...register("businessCategory")}>
            <option value="">Select a category</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Campaign goal" htmlFor="campaignGoal" error={errors.campaignGoal?.message}>
          <select id="campaignGoal" className={fieldClass} {...register("campaignGoal")}>
            <option value="">Select a goal</option>
            {CAMPAIGN_GOALS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Description"
          htmlFor="campaignDescription"
          error={errors.campaignDescription?.message}
          className="md:col-span-2"
        >
          <textarea
            id="campaignDescription"
            rows={5}
            className={fieldClass}
            placeholder="What should creators make, and what does success look like?"
            {...register("campaignDescription")}
          />
        </Field>
      </Section>

      <Section title="Targeting" description="Where the campaign should land and with whom.">
        <Field
          label="Target audience"
          htmlFor="targetAudience"
          error={errors.targetAudience?.message}
        >
          <input
            id="targetAudience"
            className={fieldClass}
            placeholder="Women 18–30, urban India"
            {...register("targetAudience")}
          />
        </Field>

        <Field
          label="Target location"
          htmlFor="targetLocation"
          error={errors.targetLocation?.message}
        >
          <input
            id="targetLocation"
            className={fieldClass}
            placeholder="Mumbai, Delhi"
            {...register("targetLocation")}
          />
        </Field>

        <Field
          label="Target platform"
          htmlFor="targetPlatform"
          error={errors.targetPlatform?.message}
        >
          <select id="targetPlatform" className={fieldClass} {...register("targetPlatform")}>
            <option value="">Select a platform</option>
            {PRIMARY_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Preferred creator category"
          htmlFor="preferredCreatorCategory"
          error={errors.preferredCreatorCategory?.message}
        >
          <select
            id="preferredCreatorCategory"
            className={fieldClass}
            {...register("preferredCreatorCategory")}
          >
            <option value="">Select a category</option>
            {INFLUENCER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Minimum followers"
          htmlFor="minimumFollowers"
          error={errors.minimumFollowers?.message}
        >
          <input
            id="minimumFollowers"
            type="number"
            min={0}
            className={fieldClass}
            placeholder="10000"
            {...register("minimumFollowers")}
          />
        </Field>

        <Field
          label="Maximum followers"
          htmlFor="maximumFollowers"
          error={errors.maximumFollowers?.message}
        >
          <input
            id="maximumFollowers"
            type="number"
            min={0}
            className={fieldClass}
            placeholder="200000"
            {...register("maximumFollowers")}
          />
        </Field>
      </Section>

      <Section
        title="Budget & delivery"
        description="What you will spend and what you expect back."
      >
        <Field label="Required views" htmlFor="requiredViews" error={errors.requiredViews?.message}>
          <input
            id="requiredViews"
            type="number"
            min={0}
            className={fieldClass}
            placeholder="500000"
            {...register("requiredViews")}
          />
        </Field>

        <Field label="Budget (₹)" htmlFor="budget" error={errors.budget?.message}>
          <input
            id="budget"
            type="number"
            min={0}
            step="0.01"
            className={fieldClass}
            placeholder="150000"
            {...register("budget")}
          />
        </Field>

        <Field
          label="Campaign duration (days)"
          htmlFor="durationDays"
          error={errors.durationDays?.message}
        >
          <input
            id="durationDays"
            type="number"
            min={1}
            className={fieldClass}
            placeholder="30"
            {...register("durationDays")}
          />
        </Field>

        <Field
          label="Attachment"
          htmlFor="attachmentUrl"
          optional
          error={errors.attachmentUrl?.message}
          className="md:col-span-2"
        >
          <AttachmentUpload
            userId={userId}
            value={attachmentUrl || undefined}
            onChange={(path) =>
              setValue("attachmentUrl", path ?? "", { shouldDirty: true, shouldValidate: false })
            }
          />
        </Field>
      </Section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Working…" : "Submit request"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={saving}
          onClick={(e) => void run("draft")(e)}
        >
          Save draft
        </Button>
      </div>
    </form>
  );
}
