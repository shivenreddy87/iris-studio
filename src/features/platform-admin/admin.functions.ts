import { createServerFn } from "@tanstack/react-start";
import { recordAdminAudit } from "@/lib/audit.server";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdmin } from "@/features/contests/contest.server";
import {
  activateUser,
  buildBusinessReport,
  buildInfluencerReport,
  buildPlatformReport,
  createCategoryRow,
  createChannelRow,
  createTemplateRow,
  deleteCategoryRow,
  deleteChannelRow,
  deleteTemplateRow,
  fetchSettings,
  getUserRow,
  listBusinessRows,
  listCategoryRows,
  listChannelRows,
  listInfluencerRows,
  listModeration,
  listSettingsHistory,
  listSuspensions,
  listTemplateRows,
  recordModeration,
  saveSettings,
  suspendUser,
  updateCategoryRow,
  updateChannelRow,
  updateTemplateRow,
  type TemplateInput,
} from "./admin.server";
import type {
  AdminUserRow,
  ContestTemplate,
  ModerationAction,
  ModerationRecord,
  ModerationTargetType,
  PlatformCategory,
  PlatformChannel,
  PlatformSettings,
  PlatformSettingsValues,
  ReportKind,
  ReportPayload,
  Suspension,
} from "./types";

/* --------------------------------- users -------------------------------- */

export const listAdminBusinesses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string } | undefined) => data ?? {})
  .handler(async ({ data, context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listBusinessRows(data.search);
  });

export const listAdminInfluencers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { search?: string } | undefined) => data ?? {})
  .handler(async ({ data, context }): Promise<AdminUserRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listInfluencerRows(data.search);
  });

export const getAdminUser = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { userId: string }) => data)
  .handler(async ({ data, context }): Promise<AdminUserRow | null> => {
    await assertAdmin(context.supabase, context.userId);
    return getUserRow(data.userId);
  });

export const suspendPlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; role: "business" | "influencer"; reason: string }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    if (!data.reason.trim()) throw new Error("A suspension reason is required.");
    await suspendUser({ ...data, actorId: context.userId });
    await recordAdminAudit(context.userId, data.role, "suspend_user", {
      entityId: data.userId,
      newValues: { reason: data.reason },
    });
    return { ok: true };
  });

export const reactivatePlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { userId: string; role: "business" | "influencer"; note?: string }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await activateUser({ ...data, actorId: context.userId });
    await recordAdminAudit(context.userId, data.role, "reactivate_user", {
      entityId: data.userId,
      newValues: { note: data.note ?? null },
    });
    return { ok: true };
  });

export const listPlatformSuspensions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Suspension[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listSuspensions();
  });

/* ------------------------------- moderation ----------------------------- */

export const listModerationRecords = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { targetType?: ModerationTargetType; targetId?: string } | undefined) => data ?? {},
  )
  .handler(async ({ data, context }): Promise<ModerationRecord[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listModeration(data);
  });

export const addModerationRecord = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      targetType: ModerationTargetType;
      targetId: string;
      action: ModerationAction;
      reason?: string;
      note?: string;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await recordModeration({ ...data, actorId: context.userId });
    await recordAdminAudit(context.userId, data.targetType, `moderation_${data.action}`, {
      entityId: data.targetId,
      newValues: { reason: data.reason ?? null, note: data.note ?? null },
    });
    return { ok: true };
  });

/* ------------------------- categories and channels ---------------------- */

export const listPlatformCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind?: "business" | "creator" } | undefined) => data ?? {})
  .handler(async ({ data, context }): Promise<PlatformCategory[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listCategoryRows(data.kind);
  });

export const savePlatformCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      id?: string;
      kind: "business" | "creator";
      name?: string;
      isActive?: boolean;
      sortOrder?: number;
    }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    if (data.id) {
      await updateCategoryRow({
        id: data.id,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      });
    } else {
      if (!data.name?.trim()) throw new Error("Category name is required.");
      await createCategoryRow({
        kind: data.kind,
        name: data.name.trim(),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      });
    }
    await recordAdminAudit(context.userId, "platform_category", data.id ? "update" : "create", {
      entityId: data.id ?? null,
      newValues: data,
    });
    return { ok: true };
  });

export const removePlatformCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await deleteCategoryRow(data.id);
    await recordAdminAudit(context.userId, "platform_category", "delete", { entityId: data.id });
    return { ok: true };
  });

export const listPlatformChannels = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlatformChannel[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listChannelRows();
  });

export const savePlatformChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: { id?: string; name?: string; isActive?: boolean; sortOrder?: number }) => data,
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    if (data.id) {
      await updateChannelRow({
        id: data.id,
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      });
    } else {
      if (!data.name?.trim()) throw new Error("Platform name is required.");
      await createChannelRow({
        name: data.name.trim(),
        ...(data.sortOrder !== undefined ? { sortOrder: data.sortOrder } : {}),
      });
    }
    await recordAdminAudit(context.userId, "platform_channel", data.id ? "update" : "create", {
      entityId: data.id ?? null,
      newValues: data,
    });
    return { ok: true };
  });

export const removePlatformChannel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await deleteChannelRow(data.id);
    await recordAdminAudit(context.userId, "platform_channel", "delete", { entityId: data.id });
    return { ok: true };
  });

/* -------------------------------- templates ----------------------------- */

export const listContestTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContestTemplate[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listTemplateRows();
  });

export const saveContestTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id?: string; template: TemplateInput }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    if (!data.template.name?.trim()) throw new Error("Template name is required.");
    if (data.id) await updateTemplateRow(data.id, data.template);
    else await createTemplateRow(data.template, context.userId);
    await recordAdminAudit(context.userId, "contest_template", data.id ? "update" : "create", {
      entityId: data.id ?? null,
      newValues: data.template,
    });
    return { ok: true };
  });

export const removeContestTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    await deleteTemplateRow(data.id);
    await recordAdminAudit(context.userId, "contest_template", "delete", { entityId: data.id });
    return { ok: true };
  });

/* -------------------------------- settings ------------------------------ */

export const getPlatformSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlatformSettings> => {
    await assertAdmin(context.supabase, context.userId);
    return fetchSettings();
  });

export const getPlatformSettingsHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlatformSettings[]> => {
    await assertAdmin(context.supabase, context.userId);
    return listSettingsHistory();
  });

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { settings: PlatformSettingsValues; note?: string }) => data)
  .handler(async ({ data, context }): Promise<PlatformSettings> => {
    await assertNotSuspended(context.userId);
    await assertAdmin(context.supabase, context.userId);
    const previous = await fetchSettings();
    const saved = await saveSettings(data.settings, data.note ?? null, context.userId);
    await recordAdminAudit(context.userId, "platform_settings", "update", {
      entityId: saved.id,
      previousValues: previous.settings,
      newValues: saved.settings,
    });
    return saved;
  });

/* --------------------------------- reports ------------------------------ */

export const generatePlatformReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: ReportKind }) => data)
  .handler(async ({ data, context }): Promise<ReportPayload> => {
    await assertAdmin(context.supabase, context.userId);
    return buildPlatformReport(data.kind);
  });

export const generateBusinessReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: ReportKind }) => data)
  .handler(async ({ data, context }): Promise<ReportPayload> => {
    return buildBusinessReport(data.kind, context.userId);
  });

export const generateInfluencerReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: ReportKind }) => data)
  .handler(async ({ data, context }): Promise<ReportPayload> => {
    return buildInfluencerReport(data.kind, context.userId);
  });
