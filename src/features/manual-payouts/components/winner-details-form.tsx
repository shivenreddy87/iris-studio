import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BUCKET_RULES, uploadToBucket } from "@/lib/storage";
import { Field, fieldClass } from "@/features/profiles/components/field";
import { payoutDetailsSchema, type PayoutDetailsInput } from "../payout.schema";

/**
 * One-time payout details capture. Once submitted the winner can no longer edit
 * the values — an admin has to intervene, which keeps the payment trail clean.
 */
export function WinnerDetailsForm({
  winnerId,
  userId,
  submitting,
  onSubmit,
}: {
  winnerId: string;
  userId: string;
  submitting: boolean;
  onSubmit: (values: PayoutDetailsInput) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);

  const form = useForm<PayoutDetailsInput>({
    resolver: zodResolver(payoutDetailsSchema),
    mode: "onChange",
    defaultValues: {
      winnerId,
      fullName: "",
      phone: "",
      email: "",
      country: "",
      bankHolderName: "",
      bankName: "",
      accountNumber: "",
      ifsc: "",
      swift: "",
      upiId: "",
      paypalEmail: "",
      governmentIdUrl: "",
      taxId: "",
      declarationAccepted: false as unknown as true,
    } as unknown as PayoutDetailsInput,
  });

  const { register, handleSubmit, formState, setValue, watch } = form;
  const errors = formState.errors;
  const idPath = watch("governmentIdUrl");

  async function handleFile(file: File) {
    setUploading(true);
    const result = await uploadToBucket("payout-documents", file, userId);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setValue("governmentIdUrl", result.path, { shouldValidate: true });
    toast.success("Document uploaded.");
  }

  return (
    <form onSubmit={handleSubmit(async (values) => onSubmit(values))} className="space-y-6">
      <input type="hidden" {...register("winnerId")} />

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold text-ink">Personal information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full legal name" htmlFor="fullName" error={errors.fullName?.message}>
            <input id="fullName" className={fieldClass} {...register("fullName")} />
          </Field>
          <Field label="Country" htmlFor="country" error={errors.country?.message}>
            <input id="country" className={fieldClass} {...register("country")} />
          </Field>
          <Field label="Phone number" htmlFor="phone" error={errors.phone?.message}>
            <input id="phone" className={fieldClass} {...register("phone")} />
          </Field>
          <Field label="Email" htmlFor="email" error={errors.email?.message}>
            <input id="email" type="email" className={fieldClass} {...register("email")} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-display text-sm font-semibold text-ink">Payment information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Account holder name"
            htmlFor="bankHolderName"
            error={errors.bankHolderName?.message}
          >
            <input id="bankHolderName" className={fieldClass} {...register("bankHolderName")} />
          </Field>
          <Field label="Bank name" htmlFor="bankName" error={errors.bankName?.message}>
            <input id="bankName" className={fieldClass} {...register("bankName")} />
          </Field>
          <Field
            label="Account number"
            htmlFor="accountNumber"
            error={errors.accountNumber?.message}
          >
            <input id="accountNumber" className={fieldClass} {...register("accountNumber")} />
          </Field>
          <Field
            label="IFSC code"
            htmlFor="ifsc"
            error={errors.ifsc?.message}
            hint="Provide either IFSC (India) or SWIFT (international)."
          >
            <input id="ifsc" className={fieldClass} {...register("ifsc")} />
          </Field>
          <Field label="SWIFT code" htmlFor="swift" optional error={errors.swift?.message}>
            <input id="swift" className={fieldClass} {...register("swift")} />
          </Field>
          <Field label="UPI ID" htmlFor="upiId" optional error={errors.upiId?.message}>
            <input id="upiId" className={fieldClass} {...register("upiId")} />
          </Field>
          <Field
            label="PayPal email"
            htmlFor="paypalEmail"
            optional
            error={errors.paypalEmail?.message}
          >
            <input id="paypalEmail" className={fieldClass} {...register("paypalEmail")} />
          </Field>
          <Field label="Tax ID / PAN" htmlFor="taxId" optional error={errors.taxId?.message}>
            <input id="taxId" className={fieldClass} {...register("taxId")} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-ink">Verification</h3>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hairline bg-surface-2 px-4 py-2 text-sm text-ink-dim">
          <input
            type="file"
            accept={BUCKET_RULES["payout-documents"].accept}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Upload className="size-4" />
          {uploading ? "Uploading…" : idPath ? "Replace government ID" : "Upload government ID"}
        </label>
        {idPath ? <p className="text-xs text-ink-mute">Document attached (private).</p> : null}
        <p className="text-xs text-ink-mute">
          Optional. Files are stored privately and are only visible to the payouts team.
        </p>
      </section>

      <label className="flex items-start gap-3 rounded-2xl border border-hairline bg-surface-2 p-4">
        <input type="checkbox" className="mt-1" {...register("declarationAccepted")} />
        <span className="text-sm text-ink-dim">
          I confirm these payment details are accurate and belong to me. I understand payments are
          made manually outside the platform and cannot be reversed once sent.
        </span>
      </label>
      {errors.declarationAccepted ? (
        <p className="text-sm text-rose">{errors.declarationAccepted.message}</p>
      ) : null}

      <Button type="submit" disabled={submitting || uploading}>
        {submitting ? "Submitting…" : "Submit payout details"}
      </Button>
    </form>
  );
}
