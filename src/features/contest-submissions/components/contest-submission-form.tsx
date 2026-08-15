import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Field, fieldClass } from "@/features/profiles/components/field";
import { getProvider } from "@/features/social-verification/providers";
import { submissionSchema, type SubmissionFormValues } from "../submission.schema";
import {
  SUBMISSION_PLATFORMS,
  SUBMISSION_PLATFORM_LABELS,
  type SubmissionPlatform,
} from "../types";

function isSubmissionPlatform(value: string | null | undefined): value is SubmissionPlatform {
  return !!value && (SUBMISSION_PLATFORMS as readonly string[]).includes(value.toLowerCase());
}

/**
 * One-way submission form: content can be submitted once and never edited.
 * When the contest declares a platform, the form locks to it and asks for the
 * exact artefact that platform expects (Instagram Reel URL / YouTube video URL).
 */
export function ContestSubmissionForm({
  submitting,
  contestPlatform,
  onSubmit,
}: {
  submitting: boolean;
  contestPlatform?: string | null;
  onSubmit: (values: SubmissionFormValues) => Promise<void>;
}) {
  const locked = isSubmissionPlatform(contestPlatform)
    ? (contestPlatform.toLowerCase() as SubmissionPlatform)
    : null;

  const form = useForm<SubmissionFormValues>({
    resolver: zodResolver(submissionSchema),
    mode: "onChange",
    defaultValues: {
      platform: locked ?? "instagram",
      contentUrl: "",
      caption: "",
      notes: "",
      agreed: false as unknown as true,
    },
  });

  const { register, handleSubmit, formState, watch } = form;
  const errors = formState.errors;
  const active = locked ?? watch("platform");
  const provider = getProvider(active);
  const urlLabel =
    provider?.contentLabel ??
    (active === "instagram" ? "Instagram Reel URL" : "Published content URL");
  const placeholder = provider?.contentPlaceholder ?? "https://";

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit({ ...values, platform: locked ?? values.platform });
      })}
      className="space-y-5"
    >
      {locked ? (
        <input type="hidden" value={locked} {...register("platform")} />
      ) : (
        <Field label="Platform" htmlFor="platform" error={errors.platform?.message}>
          <select id="platform" className={fieldClass} {...register("platform")}>
            {SUBMISSION_PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {SUBMISSION_PLATFORM_LABELS[platform]}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label={urlLabel}
        htmlFor="contentUrl"
        error={errors.contentUrl?.message}
        hint={
          locked
            ? `This contest runs on ${SUBMISSION_PLATFORM_LABELS[locked]}. Paste the public link to the content you published there — it is verified against ${SUBMISSION_PLATFORM_LABELS[locked]} and cannot be changed afterwards.`
            : "A public link to the live post, reel or video you published for this contest."
        }
      >
        <input
          id="contentUrl"
          inputMode="url"
          className={fieldClass}
          placeholder={placeholder}
          {...register("contentUrl")}
        />
      </Field>

      <Field label="Caption used" htmlFor="caption" optional error={errors.caption?.message}>
        <Textarea id="caption" rows={4} className={fieldClass} {...register("caption")} />
      </Field>

      <Field label="Notes for the reviewer" htmlFor="notes" optional error={errors.notes?.message}>
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
      {errors.agreed?.message ? <p className="text-xs text-rose">{errors.agreed.message}</p> : null}

      <Button type="submit" disabled={submitting || !formState.isValid}>
        {submitting ? "Submitting…" : "Submit content"}
      </Button>
    </form>
  );
}
