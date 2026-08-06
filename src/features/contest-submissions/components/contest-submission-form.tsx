import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, fieldClass } from "@/features/profiles/components/field";
import { submissionSchema, type SubmissionFormValues } from "../submission.schema";
import { SUBMISSION_PLATFORMS, SUBMISSION_PLATFORM_LABELS } from "../types";

/** One-way submission form: content can be submitted once and never edited. */
export function ContestSubmissionForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean;
  onSubmit: (values: SubmissionFormValues) => Promise<void>;
}) {
  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    mode: "onChange",
    defaultValues: {
      platform: "instagram",
      contentUrl: "",
      caption: "",
      notes: "",
      agreed: false as unknown as true,
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
      <Field label="Platform" htmlFor="platform" error={errors.platform?.message}>
        <select id="platform" className={fieldClass} {...register("platform")}>
          {SUBMISSION_PLATFORMS.map((platform) => (
            <option key={platform} value={platform}>
              {SUBMISSION_PLATFORM_LABELS[platform]}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Published content URL"
        htmlFor="contentUrl"
        error={errors.contentUrl?.message}
        hint="A public link to the live post, reel or video you published for this contest."
      >
        <input
          id="contentUrl"
          className={fieldClass}
          placeholder="https://instagram.com/reel/..."
          {...register("contentUrl")}
        />
      </Field>

      <Field label="Caption used" htmlFor="caption" optional error={errors.caption?.message}>
        <Textarea id="caption" rows={4} className={fieldClass} {...register("caption")} />
      </Field>

      <Field
        label="Notes for the reviewer"
        htmlFor="notes"
        optional
        error={errors.notes?.message}
      >
        <Textarea id="notes" rows={3} className={fieldClass} {...register("notes")} />
      </Field>

      <label className="flex items-start gap-3 text-sm text-ink-dim">
        <input
          type="checkbox"
          className="mt-1 size-4 rounded border-hairline bg-surface-3 accent-violet"
          {...register("agreed")}
        />
        <span>
          I confirm this content is live and meets the contest brief. Submissions are final and
          cannot be edited or resubmitted.
        </span>
      </label>
      {errors.agreed?.message ? (
        <p className="text-xs text-rose">{errors.agreed.message}</p>
      ) : null}

      <Button type="submit" disabled={submitting || !formState.isValid}>
        {submitting ? "Submitting…" : "Submit content"}
      </Button>
    </form>
  );
}
