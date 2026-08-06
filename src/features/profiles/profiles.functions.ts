import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  businessProfileSchema,
  influencerProfileSchema,
  type BusinessProfile,
  type InfluencerProfile,
  type MyProfile,
} from "./types";

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyProfile> => {
    const { supabase, userId } = context;

    const [profileRes, roleRes, businessRes, creatorRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email, onboarding_completed_at")
        .eq("id", userId)
        .maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
      supabase.from("business_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("creator_profiles").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const business: BusinessProfile | null = businessRes.data
      ? {
          businessName: businessRes.data.business_name ?? "",
          category: businessRes.data.category ?? "",
          contactPerson: businessRes.data.contact_person ?? "",
          contactEmail: businessRes.data.contact_email ?? "",
          phone: businessRes.data.phone ?? "",
          location: businessRes.data.location ?? "",
          website: businessRes.data.website ?? undefined,
          instagram: businessRes.data.instagram ?? undefined,
          description: businessRes.data.description ?? "",
          logoUrl: businessRes.data.logo_url ?? undefined,
        }
      : null;

    const influencer: InfluencerProfile | null = creatorRes.data
      ? {
          fullName: creatorRes.data.display_name ?? "",
          username: creatorRes.data.username ?? "",
          category: creatorRes.data.niche ?? "",
          location: creatorRes.data.location ?? "",
          primaryPlatform: creatorRes.data.primary_platform ?? "",
          followerRange: creatorRes.data.follower_range ?? "",
          bio: creatorRes.data.bio ?? "",
          instagramHandle: creatorRes.data.handle ?? "",
          tiktokHandle: creatorRes.data.tiktok_handle ?? undefined,
          youtubeChannel: creatorRes.data.youtube_channel ?? undefined,
          avatarUrl: creatorRes.data.avatar_url ?? undefined,
        }
      : null;

    return {
      userId,
      fullName: profileRes.data?.full_name ?? null,
      email: profileRes.data?.email ?? null,
      role: (roleRes.data?.role as MyProfile["role"]) ?? null,
      onboardingCompletedAt: profileRes.data?.onboarding_completed_at ?? null,
      business,
      influencer,
    };
  });

export const upsertBusinessProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => businessProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("business_profiles").upsert(
      {
        user_id: userId,
        business_name: data.businessName,
        category: data.category,
        contact_person: data.contactPerson,
        contact_email: data.contactEmail,
        phone: data.phone,
        location: data.location,
        website: data.website ?? null,
        instagram: data.instagram ?? null,
        description: data.description,
        logo_url: data.logoUrl ?? null,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const upsertInfluencerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => influencerProfileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("creator_profiles").upsert(
      {
        user_id: userId,
        display_name: data.fullName,
        username: data.username,
        niche: data.category,
        location: data.location,
        primary_platform: data.primaryPlatform,
        follower_range: data.followerRange,
        bio: data.bio,
        handle: data.instagramHandle,
        tiktok_handle: data.tiktokHandle ?? null,
        youtube_channel: data.youtubeChannel ?? null,
        avatar_url: data.avatarUrl ?? null,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
