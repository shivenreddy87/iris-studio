import { z } from "zod";

const httpUrl = z
  .string()
  .trim()
  .min(1, "Portfolio link is required")
  .max(500, "Portfolio link must be under 500 characters")
  .refine(
    (value) => /^https?:\/\/\S+\.\S+/i.test(value),
    "Enter a full link starting with http:// or https://",
  );

/** Shared by the form and the server function validator. */
export const applicationSchema = z.object({
  portfolioUrl: httpUrl,
  contentIdea: z
    .string()
    .trim()
    .min(40, "Describe your approach in at least 40 characters")
    .max(4000, "Keep your approach under 4000 characters"),
  notes: z.string().trim().max(2000, "Keep notes under 2000 characters").optional().or(z.literal("")),
  agreedToRules: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the contest rules" }),
  }),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;

export const applicationInputSchema = applicationSchema.extend({
  contestId: z.string().uuid(),
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;

export const withdrawSchema = z.object({
  applicationId: z.string().uuid(),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

export type WithdrawInput = z.infer<typeof withdrawSchema>;
