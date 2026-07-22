import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const searchCreators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ q: z.string().max(200).optional() }).parse(d))
  .handler(async ({ context, data }) => {
    let query = context.supabase.from("creator_profiles").select("*").limit(60);
    if (data.q && data.q.trim()) {
      const q = data.q.trim();
      query = query.or(
        `display_name.ilike.%${q}%,handle.ilike.%${q}%,niche.ilike.%${q}%,location.ilike.%${q}%,bio.ilike.%${q}%`,
      );
    }
    const { data: rows, error } = await query.order("match_score", { ascending: false });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCreator = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: creator, error } = await context.supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", data.user_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return creator;
  });

const UpsertCreator = z.object({
  handle: z.string().min(2).max(60).optional(),
  display_name: z.string().min(1).max(120).optional(),
  niche: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  followers: z.number().int().min(0).optional(),
  engagement_rate: z.number().min(0).max(100).optional(),
  avg_rate: z.number().int().min(0).optional(),
  tags: z.array(z.string()).optional(),
  bio: z.string().max(2000).optional(),
  accent: z.enum(["violet", "rose"]).optional(),
});

export const upsertCreatorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpsertCreator.parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("creator_profiles")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      const { data: updated, error } = await supabase
        .from("creator_profiles")
        .update(data)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) throw new Error(error.message);
      return updated;
    }
    const { data: inserted, error } = await supabase
      .from("creator_profiles")
      .insert({ user_id: userId, ...data })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

export const getMyCreatorProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    return data;
  });
