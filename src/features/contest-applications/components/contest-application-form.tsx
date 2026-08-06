import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, fieldClass } from "@/features/profiles/components/field";
import { applicationSchema, type ApplicationFormValues } from "../application.schema";

export function ContestApplicationForm({
  contestRules,
  submitting,
  onSubmit,
}: {
  contestRules?: string | null;
  submitting: boolean;
  onSubmit: (values: ApplicationFormValues) => Promise<void>;
}) {
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    mode: "onChange",
    defaultValues: {
      portfolioUrl: "",
      contentIdea: "",
      notes: "",
      agreedToRules: false as unknown as true,
    },
  });

  const { register, handleSubmit, formState } = form;
  const errors = formState.errors;

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-5"
    >
      <Field
        label="Portfolio or sample work link"
        htmlFor="portfolioUrl"
        error={errors.portfolioUrl?.message}
        hint="Link to your best-performing content for this niche."
      >
        <input
          id="portfolioUrl"
          className={fieldClass}
          placeholder="https://instagram.com/p/..."
          {...register("portfolioUrl")}
        />
      </Field>

      <Field
        label="Your content idea"
        htmlFor="contentIdea"
        error={errors.contentIdea?.message}
        hint="How would you bring this contest brief to life?"
      >
        <Textarea id="contentIdea" rows={5} className={fieldClass} {...register("contentIdea")} />
      </Field>

      <Field
        label="Anything else the reviewers should know"
        htmlFor="notes"
        optional
        error={errors.notes?.message}
      >
        <Textarea id="notes" rows={3} className={fieldClass} {...register("notes")} />
      </Field>

      {contestRules ? (
        <div className="max-h-40 overflow-y-auto rounded-2xl border border-hairline bg-surface-3 p-4 text-sm text-ink-dim whitespace-pre-wrap">
          {contestRules}
        </div>
      ) : null}

      <label className="flex items-start gap-3 text-sm text-ink-dim">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-hairline bg-surface-3 accent-violet"
          {...register("agreedToRules")}
        />
        <span>I have read and agree to the contest rules and deliverables.</span>
      </label>
      {errors.agreedToRules?.message ? (
        <p className="text-xs text-rose">{errors.agreedToRules.message}</p>
      ) : null}

      <Button type="submit" disabled={submitting || !formState.isValid}>
        {submitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
