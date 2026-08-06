import { z } from "zod";

export const metricsInputSchema = z.object({
  submissionId: z.string().uuid(),
  views: z.coerce.number().int().min(0, "Views cannot be negative"),
  likes: z.coerce.number().int().min(0, "Likes cannot be negative"),
  comments: z.coerce.number().int().min(0, "Comments cannot be negative"),
  shares: z.coerce.number().int().min(0, "Shares cannot be negative"),
  reviewScore: z.coerce.number().min(0).max(10).nullable().optional(),
  reviewNotes: z.string().trim().max(1000).nullable().optional(),
});

export type MetricsInput = z.infer<typeof metricsInputSchema>;

export const markWinnerSchema = z
  .object({
    submissionId: z.string().uuid(),
    rank: z.coerce.number().int().min(1, "Rank must be 1 or higher"),
    rewardAmount: z.coerce.number().min(0).nullable().optional(),
    manualScore: z.coerce.number().min(0).max(100).nullable().optional(),
    winnerNotes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((v) => v.manualScore === null || v.manualScore === undefined || !!v.winnerNotes, {
    message: "A justification note is required when overriding the score",
    path: ["winnerNotes"],
  });

export type MarkWinnerInput = z.infer<typeof markWinnerSchema>;

export const removeWinnerSchema = z.object({
  submissionId: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
});

export const finalizeWinnersSchema = z.object({
  contestId: z.string().uuid(),
  note: z.string().trim().max(500).optional(),
});
