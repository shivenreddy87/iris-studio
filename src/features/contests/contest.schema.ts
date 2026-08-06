import { z } from "zod";

const optionalText = z.string().trim().max(4000).optional().or(z.literal(""));
const optionalDate = z.string().trim().optional().or(z.literal(""));
const optionalNumber = z
  .union([z.number(), z.string()])
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  });

/** Step 1 — inherited campaign information (editable while Draft). */
export const campaignInfoStepSchema = z.object({
  title: z.string().trim().min(3, "Give the contest a title").max(160),
  description: optionalText,
  campaignGoal: optionalText,
  businessCategory: optionalText,
  attachmentUrl: z.string().trim().optional().or(z.literal("")),
});

/** Step 2 — eligibility. */
export const eligibilityStepSchema = z.object({
  preferredCreatorCategory: optionalText,
  minimumFollowers: optionalNumber,
  maximumFollowers: optionalNumber,
  targetLocation: optionalText,
  targetPlatform: optionalText,
});

/** Step 3 — rewards. */
export const rewardStepSchema = z.object({
  rewardPool: optionalNumber,
  winnerCount: optionalNumber,
  participantLimit: optionalNumber,
  requiredViews: optionalNumber,
});

/** Step 4 — timeline. */
export const timelineStepSchema = z.object({
  applicationStartDate: optionalDate,
  applicationDeadline: optionalDate,
  contestStartDate: optionalDate,
  contestEndDate: optionalDate,
});

/** Step 5 — rules. */
export const rulesStepSchema = z.object({
  contestBrief: optionalText,
  contestRules: optionalText,
});

const base = campaignInfoStepSchema
  .merge(eligibilityStepSchema)
  .merge(rewardStepSchema)
  .merge(timelineStepSchema)
  .merge(rulesStepSchema);

function applyDateRules(v: z.output<typeof base>, ctx: z.RefinementCtx) {
  const d = (value?: string) => (value && value !== "" ? new Date(value).getTime() : null);
  const appStart = d(v.applicationStartDate);
  const appEnd = d(v.applicationDeadline);
  const start = d(v.contestStartDate);
  const end = d(v.contestEndDate);

  if (appStart !== null && appEnd !== null && appEnd < appStart) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["applicationDeadline"],
      message: "Applications must close after they open",
    });
  }
  if (appEnd !== null && start !== null && appEnd > start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contestStartDate"],
      message: "Applications must close before the contest starts",
    });
  }
  if (start !== null && end !== null && end <= start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contestEndDate"],
      message: "The contest must end after it starts",
    });
  }
  if (
    typeof v.minimumFollowers === "number" &&
    typeof v.maximumFollowers === "number" &&
    v.maximumFollowers < v.minimumFollowers
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["maximumFollowers"],
      message: "Maximum followers must be greater than the minimum",
    });
  }
}

/** Lenient shape used for Save Draft. */
export const contestDraftSchema = base.superRefine(applyDateRules);

/** Strict shape enforced when publishing. */
export const contestPublishSchema = base
  .superRefine(applyDateRules)
  .superRefine((v, ctx) => {
    const required: Array<[keyof z.output<typeof base>, string]> = [
      ["rewardPool", "Set a reward pool"],
      ["winnerCount", "Set the number of winners"],
      ["participantLimit", "Set a maximum number of participants"],
      ["applicationStartDate", "Set the applications open date"],
      ["applicationDeadline", "Set the applications close date"],
      ["contestStartDate", "Set the contest start date"],
      ["contestEndDate", "Set the contest end date"],
      ["contestBrief", "Write a contest brief"],
      ["contestRules", "Write the contest rules"],
      ["targetPlatform", "Select the eligible platform"],
    ];
    for (const [key, message] of required) {
      const value = v[key];
      if (value === undefined || value === "" || value === null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key as string], message });
      }
    }
  });

export type ContestFormInput = z.input<typeof base>;
export type ContestFormValues = z.output<typeof base>;
