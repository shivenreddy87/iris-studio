import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, fieldClass } from "./field";
import { AvatarUpload } from "./avatar-upload";
import {
  influencerProfileSchema,
  INFLUENCER_CATEGORIES,
  PRIMARY_PLATFORMS,
  FOLLOWER_RANGES,
  type InfluencerProfile,
} from "../types";

export function InfluencerProfileForm({
  userId,
  defaultValues,
  submitLabel,
  onSubmit,
}: {
  userId: string;
  defaultValues?: InfluencerProfile | null;
  submitLabel: string;
  onSubmit: (values: InfluencerProfile) => Promise<void>;
}) {
  const form = useForm<InfluencerProfile>({
    resolver: zodResolver(influencerProfileSchema),
    mode: "onChange",
    defaultValues: {
      fullName: defaultValues?.fullName ?? "",
      username: defaultValues?.username ?? "",
      category: defaultValues?.category ?? "",
      location: defaultValues?.location ?? "",
      primaryPlatform: defaultValues?.primaryPlatform ?? "",
      followerRange: defaultValues?.followerRange ?? "",
      bio: defaultValues?.bio ?? "",
      instagramHandle: defaultValues?.instagramHandle ?? "",
      tiktokHandle: defaultValues?.tiktokHandle ?? "",
      youtubeChannel: defaultValues?.youtubeChannel ?? "",
      avatarUrl: defaultValues?.avatarUrl ?? "",
    },
  });

  const { register, handleSubmit, formState, setValue, watch } = form;
  const errors = formState.errors;
  const avatarUrl = watch("avatarUrl");

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
          label="Profile photo (optional)"
          value={avatarUrl || undefined}
          onChange={(path) =>
            setValue("avatarUrl", path ?? "", { shouldDirty: true, shouldValidate: true })
          }
        />
      </div>

      <div className="grid gap-5 rounded-3xl border border-hairline bg-surface-2 p-6 sm:grid-cols-2">
        <Field label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
          <input id="fullName" className={fieldClass} {...register("fullName")} />
        </Field>

        <Field label="Username" htmlFor="username" error={errors.username?.message}>
          <input
            id="username"
            className={fieldClass}
            placeholder="yourname"
            {...register("username")}
          />
        </Field>

        <Field label="Primary category" htmlFor="category" error={errors.category?.message}>
          <select id="category" className={fieldClass} {...register("category")}>
            <option value="">Select a category</option>
            {INFLUENCER_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location" htmlFor="location" error={errors.location?.message}>
          <input
            id="location"
            className={fieldClass}
            placeholder="City, Country"
            {...register("location")}
          />
        </Field>

        <Field
          label="Primary platform"
          htmlFor="primaryPlatform"
          error={errors.primaryPlatform?.message}
        >
          <select id="primaryPlatform" className={fieldClass} {...register("primaryPlatform")}>
            <option value="">Select a platform</option>
            {PRIMARY_PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Follower range" htmlFor="followerRange" error={errors.followerRange?.message}>
          <select id="followerRange" className={fieldClass} {...register("followerRange")}>
            <option value="">Select a range</option>
            {FOLLOWER_RANGES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Instagram handle"
          htmlFor="instagramHandle"
          optional
          error={errors.instagramHandle?.message}
          hint="Add at least one social handle or URL below."
        >
          <input
            id="instagramHandle"
            className={fieldClass}
            placeholder="@yourhandle"
            {...register("instagramHandle")}
          />
        </Field>

        <Field
          label="TikTok handle"
          htmlFor="tiktokHandle"
          optional
          error={errors.tiktokHandle?.message}
        >
          <input
            id="tiktokHandle"
            className={fieldClass}
            placeholder="@yourhandle"
            {...register("tiktokHandle")}
          />
        </Field>

        <Field
          label="YouTube channel"
          htmlFor="youtubeChannel"
          optional
          error={errors.youtubeChannel?.message}
        >
          <input
            id="youtubeChannel"
            className={fieldClass}
            placeholder="Channel name or URL"
            {...register("youtubeChannel")}
          />
        </Field>

        <Field
          label="Bio"
          htmlFor="bio"
          className="sm:col-span-2"
          error={errors.bio?.message}
          hint="Your audience, your content style, and what brands can expect."
        >
          <textarea id="bio" rows={5} className={fieldClass} {...register("bio")} />
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
