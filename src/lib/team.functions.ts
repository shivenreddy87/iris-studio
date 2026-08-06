import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email().max(255);

// ---------- Organization members ----------

export const listOrgMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: org } = await context.supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (!org) return [] as Array<{ id: string; role: string; user_id: string; created_at: string; profile: any }>;
    const { data: members, error } = await context.supabase
      .from("organization_members")
      .select("id, role, user_id, created_at")
      .eq("org_id", org.id)
      .order("created_at");
    if (error) throw new Error(error.message);
    const ids = (members ?? []).map((m) => m.user_id);
    const profileMap = new Map<string, any>();
    if (ids.length) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ids);
      (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));
    }
    return (members ?? []).map((m) => ({ ...m, profile: profileMap.get(m.user_id) ?? null }));
  });

export const removeOrgMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { memberId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("organization_members")
      .delete()
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Creator collaborators ----------

export const listCreatorCollaborators = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: rows, error } = await context.supabase
      .from("creator_collaborators")
      .select("id, role, collaborator_user_id, created_at")
      .eq("creator_user_id", context.userId)
      .order("created_at");
    if (error) throw new Error(error.message);
    const ids = (rows ?? []).map((r) => r.collaborator_user_id);
    const profileMap = new Map<string, any>();
    if (ids.length) {
      const { data: profiles } = await context.supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ids);
      (profiles ?? []).forEach((p: any) => profileMap.set(p.id, p));
    }
    return (rows ?? []).map((r) => ({ ...r, user_id: r.collaborator_user_id, profile: profileMap.get(r.collaborator_user_id) ?? null }));
  });

export const removeCreatorCollaborator = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { collaboratorId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("creator_collaborators")
      .delete()
      .eq("id", data.collaboratorId)
      .eq("creator_user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Invitations ----------

const inviteSchema = z.object({
  email: emailSchema,
  scope: z.enum(["organization", "creator"]),
  role: z.string().min(1).max(32),
});

export const createInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => inviteSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    let org_id: string | null = null;
    let creator_user_id: string | null = null;

    if (data.scope === "organization") {
      const { data: org } = await context.supabase
        .from("organizations")
        .select("id")
        .eq("owner_id", context.userId)
        .maybeSingle();
      if (!org) throw new Error("No organization found");
      org_id = org.id;
    } else {
      creator_user_id = context.userId;
    }

    const { data: invite, error } = await context.supabase
      .from("invitations")
      .insert({
        invited_email: data.email,
        invited_by: context.userId,
        scope: data.scope,
        org_id,
        creator_user_id,
        role: data.role,
      })
      .select("id, token, invited_email, role, scope, expires_at")
      .single();
    if (error) throw new Error(error.message);
    return invite;
  });

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { scope: "organization" | "creator" }) => d)
  .handler(async ({ data, context }) => {
    const query = context.supabase
      .from("invitations")
      .select("id, invited_email, role, status, expires_at, created_at, token, scope")
      .eq("scope", data.scope)
      .eq("invited_by", context.userId)
      .order("created_at", { ascending: false });
    const { data: rows, error } = await query;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { inviteId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    const { error } = await context.supabase
      .from("invitations")
      .update({ status: "revoked" })
      .eq("id", data.inviteId)
      .eq("invited_by", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Invitation acceptance (public token lookup + accept) ----------

export const lookupInvitation = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => ({ token: z.string().min(10).max(128).parse(d.token) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("invitations")
      .select("id, invited_email, role, scope, status, expires_at, org_id, creator_user_id")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) return { found: false as const };
    let context_name: string | null = null;
    if (invite.scope === "organization" && invite.org_id) {
      const { data: org } = await supabaseAdmin.from("organizations").select("name").eq("id", invite.org_id).maybeSingle();
      context_name = org?.name ?? null;
    } else if (invite.scope === "creator" && invite.creator_user_id) {
      const { data: prof } = await supabaseAdmin.from("profiles").select("full_name").eq("id", invite.creator_user_id).maybeSingle();
      context_name = prof?.full_name ?? null;
    }
    return { found: true as const, invite, context_name };
  });

export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { token: string }) => ({ token: z.string().min(10).max(128).parse(d.token) }))
  .handler(async ({ data, context }) => {
    await assertNotSuspended(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: invite } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!invite) throw new Error("Invitation not found");
    if (invite.status !== "pending") throw new Error(`Invitation ${invite.status}`);
    if (new Date(invite.expires_at) < new Date()) {
      await supabaseAdmin.from("invitations").update({ status: "expired" }).eq("id", invite.id);
      throw new Error("Invitation expired");
    }

    // Email match check (soft — user may accept regardless if signed in with matching email)
    const userEmail = context.claims.email as string | undefined;
    if (userEmail && userEmail.toLowerCase() !== invite.invited_email.toLowerCase()) {
      throw new Error(`This invite is for ${invite.invited_email}. Sign in with that email.`);
    }

    if (invite.scope === "organization" && invite.org_id) {
      const { error } = await supabaseAdmin
        .from("organization_members")
        .insert({ org_id: invite.org_id, user_id: context.userId, role: invite.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else if (invite.scope === "creator" && invite.creator_user_id) {
      const { error } = await supabaseAdmin
        .from("creator_collaborators")
        .insert({
          creator_user_id: invite.creator_user_id,
          collaborator_user_id: context.userId,
          role: invite.role,
        });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    }

    await supabaseAdmin
      .from("invitations")
      .update({ status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", invite.id);

    return { ok: true, scope: invite.scope };
  });
