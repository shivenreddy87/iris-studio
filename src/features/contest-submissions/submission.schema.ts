import { z } from "zod";
import { SUBMISSION_PLATFORMS } from "./types";

/** Content submission form. Mirrors the server-side rules exactly. */
export const submissionSchema = z.object({
  platform: z.enum(SUBMISSION_PLATFORMS, { message: "Choose the platform you published on" }),
  contentUrl: z
    .string()
    .trim()
    .min(1, { message: "Content URL is required" })
    .max(500, { message: "Content URL must be under 500 characters" })
    .url({ message: "Enter a valid URL starting with http or https" }),
  caption: z
    .string()
    .trim()
    .max(2000, { message: "Caption must be under 2000 characters" })
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000, { message: "Notes must be under 1000 characters" })
    .optional()
    .or(z.literal("")),
  agreed: z.literal(true, { message: "Confirm this is your final submission" }),
});

export type SubmissionFormValues = z.infer<typeof submissionSchema>;

/** Server payload: the agreement is a client-side gate, not stored. */
export const submissionInputSchema = z.object({
  contestId: z.string().uuid(),
  platform: z.enum(SUBMISSION_PLATFORMS),
  contentUrl: z.string().trim().min(1).max(500).url(),
  caption: z.string().trim().max(2000).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type SubmissionInput = z.infer<typeof submissionInputSchema>;

export const reviewInputSchema = z.object({
  submissionId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});
