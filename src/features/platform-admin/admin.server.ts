/**
 * Platform administration data layer.
 *
 * Every export assumes the caller has already been authorised by the server
 * function wrapper (`assertAdmin`), except `isUserSuspended` /
 * `assertNotSuspended`, which are guards used across feature modules.
 */

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
  ReportRow,
  Suspension,
} from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/* ------------------------------ suspensions ----------------------------- */

export async function isUserSuspended(userId: string): Promise<boolean> {
  const db = await admin();
  const { data } = await db
    .from("user_suspensions")
    .select("id")
    .eq("user_id", userId)
    .is("lifted_at", null)
    .limit(1);
  return (data ?? []).length > 0;
}

/** Blocks write actions for suspended accounts; read access is untouched. */
export async function assertNotSuspended(userId: string): Promise<void> {
  if (await isUserSuspended(userId)) {
    throw new Error(
      "Your account is currently suspended. Contact the platform team to restore access.",
    );
  }
}

export async function suspendUser(input: {
  userId: string;
  role: "business" | "influencer";
  reason: string;
  actorId: string;
}): Promise<void> {
  const db = await admin();
  if (await isUserSuspended(input.userId)) throw new Error("This account is already suspended.");

  const { error } = await db.from("user_suspensions").insert({
    user_id: input.userId,
    role: input.role,
    reason: input.reason,
    suspended_by: input.actorId,
  });
  if (error) throw new Error(error.message);

  await recordModeration({
    targetType: input.role,
    targetId: input.userId,
    action: "suspend",
    reason: input.reason,
    actorId: input.actorId,
  });
}

export async function activateUser(input: {
  userId: string;
  role: "business" | "influencer";
  note?: string;
  actorId: string;
}): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("user_suspensions")
    .update({ lifted_at: new Date().toISOString(), lifted_by: input.actorId })
    .eq("user_id", input.userId)
    .is("lifted_at", null);
  if (error) throw new Error(error.message);

  await recordModeration({
    targetType: input.role,
    targetId: input.userId,
    action: "reactivate",
    note: input.note ?? null,
    actorId: input.actorId,
  });
}

export async function listSuspensions(): Promise<Suspension[]> {
  const db = await admin();
  const { data, error } = await db
    .from("user_suspensions")
    .select("id, user_id, role, reason, suspended_at, suspended_by, lifted_at")
    .order("suspended_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    reason: row.reason,
    suspendedAt: row.suspended_at,
    suspendedBy: row.suspended_by,
    liftedAt: row.lifted_at,
  }));
}

/* ------------------------------- moderation ----------------------------- */

export async function recordModeration(input: {
  targetType: ModerationTargetType;
  targetId: string;
  action: ModerationAction;
  reason?: string | null;
  note?: string | null;
  actorId: string;
}): Promise<void> {
  const db = await admin();
  const { error } = await db.from("moderation_records").insert({
    target_type: input.targetType,
    target_id: input.targetId,
    action: input.action,
    reason: input.reason ?? null,
    note: input.note ?? null,
    actor_id: input.actorId,
  });
  if (error) throw new Error(error.message);
}

export async function listModeration(filter?: {
  targetType?: ModerationTargetType;
  targetId?: string;
}): Promise<ModerationRecord[]> {
  const db = await admin();
  let query = db
    .from("moderation_records")
    .select("id, target_type, target_id, action, reason, note, actor_id, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filter?.targetType) query = query.eq("target_type", filter.targetType);
  if (filter?.targetId) query = query.eq("target_id", filter.targetId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = data ?? [];

  const actorIds = Array.from(
    new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v))),
  );
  const { data: actors } = actorIds.length
    ? await db.from("profiles").select("id, full_name").in("id", actorIds)
    : { data: [] as { id: string; full_name: string | null }[] };
  const nameById = new Map((actors ?? []).map((a) => [a.id, a.full_name ?? "Admin"]));

  return rows.map((row) => ({
    id: row.id,
    targetType: row.target_type as ModerationTargetType,
    targetId: row.target_id,
    action: row.action as ModerationAction,
    reason: row.reason,
    note: row.note,
    actorId: row.actor_id,
    actorName: row.actor_id ? (nameById.get(row.actor_id) ?? "Admin") : null,
    createdAt: row.created_at,
  }));
}

/* --------------------------------- users -------------------------------- */

async function fetchUsersByRole(
  role: "brand" | "creator",
  search?: string,
): Promise<AdminUserRow[]> {
  const db = await admin();
  const { data: roleRows, error } = await db.from("user_roles").select("user_id").eq("role", role);
  if (error) throw new Error(error.message);
  const ids = (roleRows ?? []).map((r) => r.user_id);
  if (!ids.length) return [];

  const [{ data: profiles }, { data: suspensions }, stats] = await Promise.all([
    db.from("profiles").select("id, full_name, email, avatar_url, created_at").in("id", ids),
    db.from("user_suspensions").select("user_id, reason").in("user_id", ids).is("lifted_at", null),
    role === "brand"
      ? db
          .from("business_statistics")
          .select(
            "business_id, request_count, contest_count, completed_contest_count, application_count, reward_distributed",
          )
          .in("business_id", ids)
      : db
          .from("influencer_statistics")
          .select("influencer_id, application_count, selected_count, win_count, reward_won")
          .in("influencer_id", ids),
  ]);

  const suspendedMap = new Map((suspensions ?? []).map((s) => [s.user_id, s.reason]));
  const statsById = new Map<string, Record<string, number>>();
  for (const row of (stats.data ?? []) as ReportRow[]) {
    const key = String(row["business_id"] ?? row["influencer_id"]);
    const values: Record<string, number> = {};
    for (const [k, v] of Object.entries(row)) {
      if (k === "business_id" || k === "influencer_id") continue;
      values[k] = Number(v ?? 0);
    }
    statsById.set(key, values);
  }

  const term = search?.trim().toLowerCase();
  return (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.full_name ?? "Unnamed",
      email: p.email,
      avatarUrl: p.avatar_url,
      role: (role === "brand" ? "business" : "influencer") as AdminUserRow["role"],
      createdAt: p.created_at,
      suspended: suspendedMap.has(p.id),
      suspensionReason: suspendedMap.get(p.id) ?? null,
      stats: statsById.get(p.id) ?? {},
    }))
    .filter(
      (row) =>
        !term ||
        row.name.toLowerCase().includes(term) ||
        (row.email ?? "").toLowerCase().includes(term),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listBusinessRows(search?: string): Promise<AdminUserRow[]> {
  return fetchUsersByRole("brand", search);
}

export function listInfluencerRows(search?: string): Promise<AdminUserRow[]> {
  return fetchUsersByRole("creator", search);
}

export async function getUserRow(userId: string): Promise<AdminUserRow | null> {
  const [businesses, influencers] = await Promise.all([listBusinessRows(), listInfluencerRows()]);
  return [...businesses, ...influencers].find((row) => row.id === userId) ?? null;
}

/* ------------------------------- categories ----------------------------- */

export async function listCategoryRows(kind?: "business" | "creator"): Promise<PlatformCategory[]> {
  const db = await admin();
  let query = db
    .from("platform_categories")
    .select("id, kind, name, slug, is_active, sort_order")
    .order("kind")
    .order("sort_order");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind as "business" | "creator",
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategoryRow(input: {
  kind: "business" | "creator";
  name: string;
  sortOrder?: number;
}): Promise<void> {
  const db = await admin();
  const { error } = await db.from("platform_categories").insert({
    kind: input.kind,
    name: input.name,
    slug: slugify(input.name),
    sort_order: input.sortOrder ?? 50,
  });
  if (error) throw new Error(error.message);
}

export async function updateCategoryRow(input: {
  id: string;
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<void> {
  const db = await admin();
  const patch: { name?: string; slug?: string; is_active?: boolean; sort_order?: number } = {};
  if (input.name !== undefined) {
    patch.name = input.name;
    patch.slug = slugify(input.name);
  }
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  const { error } = await db.from("platform_categories").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteCategoryRow(id: string): Promise<void> {
  const db = await admin();
  const { error } = await db.from("platform_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- platforms ----------------------------- */

export async function listChannelRows(): Promise<PlatformChannel[]> {
  const db = await admin();
  const { data, error } = await db
    .from("platform_channels")
    .select("id, name, slug, is_active, sort_order")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

export async function createChannelRow(input: { name: string; sortOrder?: number }): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("platform_channels")
    .insert({ name: input.name, slug: slugify(input.name), sort_order: input.sortOrder ?? 50 });
  if (error) throw new Error(error.message);
}

export async function updateChannelRow(input: {
  id: string;
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<void> {
  const db = await admin();
  const patch: { name?: string; slug?: string; is_active?: boolean; sort_order?: number } = {};
  if (input.name !== undefined) {
    patch.name = input.name;
    patch.slug = slugify(input.name);
  }
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  const { error } = await db.from("platform_channels").update(patch).eq("id", input.id);
  if (error) throw new Error(error.message);
}

export async function deleteChannelRow(id: string): Promise<void> {
  const db = await admin();
  const { error } = await db.from("platform_channels").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- templates ----------------------------- */

const TEMPLATE_COLUMNS =
  "id, name, description, contest_brief, contest_rules, eligibility, reward_pool, participant_limit, winner_count, target_platform, preferred_creator_category, is_active, created_at";

type TemplateRow = {
  id: string;
  name: string;
  description: string | null;
  contest_brief: string | null;
  contest_rules: string | null;
  eligibility: unknown;
  reward_pool: number | null;
  participant_limit: number | null;
  winner_count: number | null;
  target_platform: string | null;
  preferred_creator_category: string | null;
  is_active: boolean;
  created_at: string;
};

function mapTemplate(row: TemplateRow): ContestTemplate {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    contestBrief: row.contest_brief,
    contestRules: row.contest_rules,
    eligibility: (row.eligibility ?? {}) as ContestTemplate["eligibility"],
    rewardPool: row.reward_pool,
    participantLimit: row.participant_limit,
    winnerCount: row.winner_count,
    targetPlatform: row.target_platform,
    preferredCreatorCategory: row.preferred_creator_category,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function listTemplateRows(): Promise<ContestTemplate[]> {
  const db = await admin();
  const { data, error } = await db
    .from("contest_templates")
    .select(TEMPLATE_COLUMNS)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as TemplateRow[]).map(mapTemplate);
}

export type TemplateInput = {
  name: string;
  description?: string | null;
  contestBrief?: string | null;
  contestRules?: string | null;
  eligibility?: ContestTemplate["eligibility"];
  rewardPool?: number | null;
  participantLimit?: number | null;
  winnerCount?: number | null;
  targetPlatform?: string | null;
  preferredCreatorCategory?: string | null;
  isActive?: boolean;
};

function templatePatch(input: TemplateInput) {
  return {
    name: input.name,
    description: input.description ?? null,
    contest_brief: input.contestBrief ?? null,
    contest_rules: input.contestRules ?? null,
    eligibility: input.eligibility ?? {},
    reward_pool: input.rewardPool ?? null,
    participant_limit: input.participantLimit ?? null,
    winner_count: input.winnerCount ?? null,
    target_platform: input.targetPlatform ?? null,
    preferred_creator_category: input.preferredCreatorCategory ?? null,
    is_active: input.isActive ?? true,
  };
}

export async function createTemplateRow(input: TemplateInput, actorId: string): Promise<void> {
  const db = await admin();
  const { error } = await db
    .from("contest_templates")
    .insert({ ...templatePatch(input), created_by: actorId });
  if (error) throw new Error(error.message);
}

export async function updateTemplateRow(id: string, input: TemplateInput): Promise<void> {
  const db = await admin();
  const { error } = await db.from("contest_templates").update(templatePatch(input)).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteTemplateRow(id: string): Promise<void> {
  const db = await admin();
  const { error } = await db.from("contest_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* -------------------------------- settings ------------------------------ */

export async function fetchSettings(): Promise<PlatformSettings> {
  const db = await admin();
  const { data, error } = await db
    .from("platform_settings")
    .select("id, version, settings, note, created_at")
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Platform settings have not been initialised.");
  return {
    id: data.id,
    version: data.version,
    settings: data.settings as unknown as PlatformSettingsValues,
    note: data.note,
    createdAt: data.created_at,
  };
}

/** Settings are versioned: an update writes a new row, never mutates history. */
export async function saveSettings(
  values: PlatformSettingsValues,
  note: string | null,
  actorId: string,
): Promise<PlatformSettings> {
  const db = await admin();
  const current = await fetchSettings();
  const { data, error } = await db
    .from("platform_settings")
    .insert({
      version: current.version + 1,
      settings: values as unknown as import("@/integrations/supabase/types").Json,
      note,
      created_by: actorId,
    })
    .select("id, version, settings, note, created_at")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: data.id,
    version: data.version,
    settings: data.settings as unknown as PlatformSettingsValues,
    note: data.note,
    createdAt: data.created_at,
  };
}

export async function listSettingsHistory(): Promise<PlatformSettings[]> {
  const db = await admin();
  const { data, error } = await db
    .from("platform_settings")
    .select("id, version, settings, note, created_at")
    .order("version", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    version: row.version,
    settings: row.settings as unknown as PlatformSettingsValues,
    note: row.note,
    createdAt: row.created_at,
  }));
}

/* --------------------------------- reports ------------------------------ */

const REPORT_TITLES: Record<ReportKind, string> = {
  contest: "Contest report",
  campaign_request: "Campaign request report",
  winner: "Winner report",
  payout: "Payout report",
  user: "User report",
  business: "Business report",
  influencer: "Influencer report",
  activity: "Activity report",
  contest_summary: "Contest summary",
  campaign_performance: "Campaign performance",
  reward_distribution: "Reward distribution",
  contest_history: "Contest history",
  reward_history: "Reward history",
  performance_summary: "Performance summary",
};

function payload(kind: ReportKind, rows: ReportRow[]): ReportPayload {
  return {
    kind,
    title: REPORT_TITLES[kind],
    generatedAt: new Date().toISOString(),
    rows,
  };
}

/** Admin-wide reports. Placeholder generation: rows are exported as CSV. */
export async function buildPlatformReport(kind: ReportKind): Promise<ReportPayload> {
  const db = await admin();

  switch (kind) {
    case "contest": {
      const { data } = await db
        .from("contest_statistics")
        .select(
          "contest_id, title, status, reward_pool, application_count, participant_count, submission_count, verified_count, reward_awarded, reward_paid",
        );
      return payload(kind, (data ?? []) as ReportRow[]);
    }
    case "campaign_request": {
      const { data } = await db
        .from("campaign_requests")
        .select(
          "id, title, status, budget, business_category, submitted_at, reviewed_at, created_at",
        );
      return payload(kind, (data ?? []) as ReportRow[]);
    }
    case "winner": {
      const { data } = await db
        .from("contest_winners")
        .select("id, contest_id, influencer_id, rank, final_score, reward_amount, selected_at");
      return payload(kind, (data ?? []) as ReportRow[]);
    }
    case "payout": {
      const { data } = await db
        .from("payouts")
        .select("id, contest_id, influencer_id, amount, currency, status, paid_at, created_at");
      return payload(kind, (data ?? []) as ReportRow[]);
    }
    case "user": {
      const { data } = await db.from("profiles").select("id, full_name, email, created_at");
      return payload(kind, (data ?? []) as ReportRow[]);
    }
    case "business": {
      const rows = await listBusinessRows();
      return payload(
        kind,
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          suspended: row.suspended,
          ...row.stats,
        })),
      );
    }
    case "influencer": {
      const rows = await listInfluencerRows();
      return payload(
        kind,
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          suspended: row.suspended,
          ...row.stats,
        })),
      );
    }
    case "activity":
    default: {
      const { data } = await db
        .from("activity_feed")
        .select("id, action, entity_type, entity_id, summary, created_at")
        .order("created_at", { ascending: false })
        .limit(500);
      return payload("activity", (data ?? []) as ReportRow[]);
    }
  }
}

export async function buildBusinessReport(
  kind: ReportKind,
  businessId: string,
): Promise<ReportPayload> {
  const db = await admin();
  const { data: contests } = await db
    .from("contest_statistics")
    .select(
      "contest_id, title, status, reward_pool, application_count, participant_count, submission_count, verified_count, winner_count_actual, reward_awarded, reward_paid, avg_engagement",
    )
    .eq("business_id", businessId);

  if (kind === "campaign_performance") {
    const { data } = await db
      .from("campaign_requests")
      .select("id, title, status, budget, required_views, submitted_at, reviewed_at")
      .eq("business_id", businessId);
    return payload(kind, (data ?? []) as ReportRow[]);
  }

  if (kind === "reward_distribution") {
    const { data } = await db
      .from("payouts")
      .select("id, contest_id, amount, currency, status, paid_at")
      .eq("business_id", businessId);
    return payload(kind, (data ?? []) as ReportRow[]);
  }

  return payload("contest_summary", (contests ?? []) as ReportRow[]);
}

export async function buildInfluencerReport(
  kind: ReportKind,
  influencerId: string,
): Promise<ReportPayload> {
  const db = await admin();

  if (kind === "reward_history") {
    const { data } = await db
      .from("payouts")
      .select("id, contest_id, amount, currency, status, paid_at, created_at")
      .eq("influencer_id", influencerId);
    return payload(kind, (data ?? []) as ReportRow[]);
  }

  if (kind === "performance_summary") {
    const { data } = await db
      .from("contest_submissions")
      .select(
        "id, contest_id, platform, submission_status, views, likes, comments, shares, engagement_rate, submitted_at",
      )
      .eq("influencer_id", influencerId);
    return payload(kind, (data ?? []) as ReportRow[]);
  }

  const { data } = await db
    .from("contest_applications")
    .select("id, contest_id, status, submitted_at, created_at")
    .eq("influencer_id", influencerId);
  return payload("contest_history", (data ?? []) as ReportRow[]);
}
