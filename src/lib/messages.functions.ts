import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listConversations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("conversations")
      .select(
        "*, campaign:campaigns(name), brand:profiles!conversations_brand_user_id_fkey(full_name, email), creator:creator_profiles!conversations_creator_user_id_fkey(display_name, handle, accent)",
      )
      .order("last_message_at", { ascending: false, nullsFirst: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversation_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", data.conversation_id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const sendMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ conversation_id: z.string().uuid(), body: z.string().min(1).max(4000) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Determine sender role
    const { data: convo } = await supabase
      .from("conversations")
      .select("brand_user_id, creator_user_id")
      .eq("id", data.conversation_id)
      .maybeSingle();
    if (!convo) throw new Error("Conversation not found");
    const sender_role = convo.brand_user_id === userId ? "brand" : "creator";
    const other_user = sender_role === "brand" ? convo.creator_user_id : convo.brand_user_id;

    const { data: msg, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: data.conversation_id,
        sender_id: userId,
        sender_role,
        body: data.body,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", data.conversation_id);

    await supabase.from("notifications").insert({
      user_id: other_user,
      kind: "message",
      title: "New message",
      body: data.body.slice(0, 120),
      link: sender_role === "brand" ? "/app/creator/inbox" : "/app/messages",
    });

    return msg;
  });

export const markConversationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ conversation_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: convo } = await supabase
      .from("conversations")
      .select("brand_user_id, creator_user_id")
      .eq("id", data.conversation_id)
      .maybeSingle();
    if (!convo) return null;
    const now = new Date().toISOString();
    const patch =
      convo.brand_user_id === userId ? { brand_last_read_at: now } : { creator_last_read_at: now };
    await supabase.from("conversations").update(patch).eq("id", data.conversation_id);
    return { ok: true };
  });
