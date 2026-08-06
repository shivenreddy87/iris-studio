import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v !== "" ? v : undefined));

export const payoutDetailsSchema = z
  .object({
    winnerId: z.string().uuid(),
    fullName: z.string().trim().min(2, "Full name is required").max(120),
    phone: z.string().trim().min(6, "Phone number is required").max(32),
    email: z.string().trim().email("Enter a valid email").max(255),
    country: z.string().trim().min(2, "Country is required").max(80),
    bankHolderName: z.string().trim().min(2, "Account holder name is required").max(120),
    bankName: z.string().trim().min(2, "Bank name is required").max(120),
    accountNumber: z.string().trim().min(4, "Account number is required").max(64),
    ifsc: optionalText(20),
    swift: optionalText(20),
    upiId: optionalText(120),
    paypalEmail: z
      .string()
      .trim()
      .max(255)
      .optional()
      .transform((v) => (v && v !== "" ? v : undefined))
      .refine((v) => !v || z.string().email().safeParse(v).success, "Enter a valid PayPal email"),
    governmentIdUrl: optionalText(500),
    taxId: optionalText(60),
    declarationAccepted: z.literal(true, {
      message: "You must confirm the declaration before submitting",
    }),
  })
  .refine((v) => Boolean(v.ifsc || v.swift), {
    message: "Provide either an IFSC code or a SWIFT code",
    path: ["ifsc"],
  });

export type PayoutDetailsInput = z.infer<typeof payoutDetailsSchema>;

export const markPaidSchema = z.object({
  payoutId: z.string().uuid(),
  paymentMethod: z.string().trim().min(2, "Select a payment method").max(60),
  paymentReference: z.string().trim().min(2, "A payment reference is required").max(120),
  note: z.string().trim().max(1000).optional(),
});

export const markFailedSchema = z.object({
  payoutId: z.string().uuid(),
  failureReason: z.string().trim().min(3, "Describe why the payment failed").max(500),
});

export const payoutNoteSchema = z.object({
  payoutId: z.string().uuid(),
  note: z.string().trim().max(1000).optional(),
});

export const internalNotesSchema = z.object({
  payoutId: z.string().uuid(),
  internalNotes: z.string().trim().max(2000),
});

export const bulkPayoutSchema = z.object({
  payoutIds: z.array(z.string().uuid()).min(1, "Select at least one payout"),
  note: z.string().trim().max(500).optional(),
});
