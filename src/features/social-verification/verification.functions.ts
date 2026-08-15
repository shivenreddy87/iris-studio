import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { assertAdmin } from "@/features/contests/contest.server";
import { recordAdminAudit, recordAuditLog } from "@/lib/audit.server";
import {
  listAccountsForUser,
  listPendingVerifications,
  removeAccount,
  requestVerification,
  reviewVerification,
  saveAccount,
} from "./verification.server";
import { reviewSchema, saveAccountSchema } from "./types";
import type { PendingVerification, SocialAccount } from "./types";

export const getMySocialAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SocialAccount[]> => {
    return listAccountsForUser(context.userId);
  });

export const saveSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => saveAccountSchema.parse(data))
  .handler(async ({ context, data }): Promise<SocialAccount> => {
    await assertNotSuspended(context.userId);
    const account = await saveAccount({ userId: context.userId, ...data });
    await recordAuditLog({
      actorId: context.userId,
      entityType: "connected_account",
      entityId: account.id,
      action: "social_account.saved",
      newValues: { platform: account.platform, handle: account.handle },
    });
    const { notifySocialAccountConnected } = await import(
      "@/features/activity/platform-notifications.server"
    );
    const { PLATFORM_LABELS } = await import("./types");
    await notifySocialAccountConnected({
      userId: context.userId,
      platformLabel: PLATFORM_LABELS[account.platform] ?? account.platform,
      handle: account.handle,
      isPrimary: account.isPrimary,
    });
    return account;
  });

export const deleteSocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ accountId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await removeAccount(context.userId, data.accountId);
    await recordAuditLog({
      actorId: context.userId,
      entityType: "connected_account",
      entityId: data.accountId,
      action: "social_account.removed",
    });
    return { ok: true };
  });

/** Exactly one primary account decides which contests the influencer may enter. */
export const setPrimarySocialAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ accountId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SocialAccount> => {
    await assertNotSuspended(context.userId);
    const { setPrimaryAccount } = await import("./verification.server");
    const account = await setPrimaryAccount(context.userId, data.accountId);
    await recordAuditLog({
      actorId: context.userId,
      entityType: "connected_account",
      entityId: account.id,
      action: "social_account.set_primary",
      newValues: { platform: account.platform },
    });
    return account;
  });


export const requestSocialVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ accountId: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }): Promise<SocialAccount> => {
    await assertNotSuspended(context.userId);
    const account = await requestVerification(context.userId, data.accountId);
    const { notifyAdmins } = await import("@/features/activity/notification.server");
    await notifyAdmins({
      title: "Social account verification requested",
      body: `@${account.handle} on ${account.platform} is awaiting review.`,
      link: "/app/admin/moderation",
      actionLabel: "Review",
      category: "system",
    });
    await recordAuditLog({
      actorId: context.userId,
      entityType: "connected_account",
      entityId: account.id,
      action: "social_account.verification_requested",
    });
    return account;
  });

/* --------------------------------- admin -------------------------------- */

export const listSocialVerifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        status: z.enum(["pending", "verified", "rejected", "unverified", "all"]).default("pending"),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ context, data }): Promise<PendingVerification[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listPendingVerifications(data.status);
  });

export const decideSocialVerification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => reviewSchema.parse(data))
  .handler(async ({ context, data }): Promise<SocialAccount> => {
    await assertAdmin(context.supabase, context.userId);
    const account = await reviewVerification({
      accountId: data.accountId,
      adminId: context.userId,
      decision: data.decision,
      reason: data.reason,
    });
    await recordAdminAudit(context.userId, "connected_account", `social_account.${data.decision}`, {
      entityId: account.id,
      newValues: { status: account.status, reason: data.reason ?? null },
    });
    return account;
  });
