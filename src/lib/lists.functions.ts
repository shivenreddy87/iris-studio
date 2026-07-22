import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listCreatorLists = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("creator_lists")
      .select("*, items:creator_list_items(creator_user_id)")
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((l) => ({ ...l, count: l.items?.length ?? 0 }));
  });

export const createCreatorList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ name: z.string().min(1).max(120), accent: z.enum(["violet", "rose"]).default("violet") }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { data: list, error } = await context.supabase
      .from("creator_lists")
      .insert({ name: data.name, accent: data.accent, owner_id: context.userId })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return list;
  });

export const addToList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ list_id: z.string().uuid(), creator_user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("creator_list_items")
      .upsert({ list_id: data.list_id, creator_user_id: data.creator_user_id });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ list_id: z.string().uuid(), creator_user_id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("creator_list_items")
      .delete()
      .eq("list_id", data.list_id)
      .eq("creator_user_id", data.creator_user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
