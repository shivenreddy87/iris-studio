import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "./field";
import { AvatarUpload } from "./avatar-upload";
import { businessProfileSchema, BUSINESS_CATEGORIES, type BusinessProfile } from "../types";

export function BusinessProfileForm({
  userId,
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  userId: string;
  defaultValues?: BusinessProfile | null;
  submitLabel: string;
  onSubmit: (values: BusinessProfile) => Promise<void>;
}) {
  const form = useForm<BusinessProfile>({
    resolver: zodResolver(businessProfileSchema),
    mode: "onChange",
    defaultValues: {
      businessName: defaultValues?.businessName ?? "",
      category: defaultValues?.category ?? "",
      contactPerson: defaultValues?.contactPerson ?? "",
      contactEmail: defaultValues?.contactEmail ?? "",
      phone: defaultValues?.phone ?? "",
      location: defaultValues?.location ?? "",
      website: defaultValues?.website ?? "",
      instagram: defaultValues?.instagram ?? "",
      description: defaultValues?.description ?? "",
      logoUrl: defaultValues?.logoUrl ?? "",
    },
  });

  const { register, handleSubmit, formState, setValue, watch } = form;
  const errors = formState.errors;
  const logoUrl = watch("logoUrl");

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-6"
    >
      <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
        <AvatarUpload
          userId={userId}
          label="Company logo (optional)"
          rounded="xl"
          value={logoUrl || undefined}
          onChange={(path) =>
            setValue("logoUrl", path ?? "", { shouldDirty: true, shouldValidate: true })
          }
        />
      </div>

      <div className="grid gap-5 rounded-3xl border border-hairline bg-surface-2 p-6 sm:grid-cols-2">
        <Field label="Business name" htmlFor="businessName" error={errors.businessName?.message}>
          <input id="businessName" className={fieldClass} {...register("businessName")} />
        </Field>

        <Field label="Business category" htmlFor="category" error={errors.category?.message}>
          <select id="category" className={fieldClass} {...register("category")}>
            <option value="">Select a category</option>
            {BUSINESS_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Contact person" htmlFor="contactPerson" error={errors.contactPerson?.message}>
          <input id="contactPerson" className={fieldClass} {...register("contactPerson")} />
        </Field>

        <Field label="Business email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
          <input
            id="contactEmail"
            type="email"
            className={fieldClass}
            {...register("contactEmail")}
          />
        </Field>

        <Field label="Business phone" htmlFor="phone" error={errors.phone?.message}>
          <input id="phone" className={fieldClass} {...register("phone")} />
        </Field>

        <Field label="Business location" htmlFor="location" error={errors.location?.message}>
          <input
            id="location"
            className={fieldClass}
            placeholder="City, Country"
            {...register("location")}
          />
        </Field>

        <Field label="Website" htmlFor="website" optional error={errors.website?.message}>
          <input
            id="website"
            className={fieldClass}
            placeholder="https://"
            {...register("website")}
          />
        </Field>

        <Field label="Instagram" htmlFor="instagram" optional error={errors.instagram?.message}>
          <input
            id="instagram"
            className={fieldClass}
            placeholder="@yourbrand"
            {...register("instagram")}
          />
        </Field>

        <Field
          label="Business description"
          htmlFor="description"
          className="sm:col-span-2"
          error={errors.description?.message}
          hint="What you sell, who you sell to, and what makes you different."
        >
          <textarea id="description" rows={5} className={fieldClass} {...register("description")} />
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!formState.isValid || formState.isSubmitting}>
          {formState.isSubmitting ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
