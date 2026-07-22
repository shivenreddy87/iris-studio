import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const ensureOrganization = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (existing) return existing;

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();
    const displayName = profile?.full_name ?? profile?.email?.split("@")[0] ?? "My";
    const { data, error } = await supabase
      .from("organizations")
      .insert({ name: `${displayName}'s workspace`, owner_id: userId })
      .select("id, name")
      .single();
    if (error) throw new Error(error.message);
    return data;
  });

export const getMyOrganization = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("organizations")
      .select("id, name")
      .eq("owner_id", context.userId)
      .limit(1)
      .maybeSingle();
    return data;
  });
