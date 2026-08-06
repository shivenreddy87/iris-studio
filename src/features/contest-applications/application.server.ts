import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  CONTEST_COLUMNS,
  isAdmin,
  toContest,
  type ContestRow,
} from "@/features/contests/contest.server";
import { loadInfluencerProfile } from "@/features/contests/discovery.server";
import { evaluateAvailability, evaluateEligibility } from "@/features/contests/eligibility";
import type { Contest } from "@/features/contests/types";
import {
  applicationFailure,
  canWithdraw,
  type ApplicationEvent,
  type ApplicationEventType,
  type ApplicationStatus,
  type ApplicationSummaryCounts,
  type ApplicationValidation,
  type ContestApplication,
  APPLICATION_STATUSES,
} from "./types";

export type Db = SupabaseClient<Database>;

export type ApplicationRow = {
  id: string;
  contest_id: string;
  influencer_id: string;
  portfolio_url: string;
  content_idea: string;
  notes: string | null;
  status: ApplicationStatus;
  submitted_at: string;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
};

export const APPLICATION_COLUMNS =
  "id, contest_id, influencer_id, portfolio_url, content_idea, notes, status, submitted_at, withdrawn_at, created_at, updated_at";

type ContestFacts = Pick<
  Contest,
  "id" | "title" | "businessCategory" | "applicationDeadline" | "status"
>;

export type Applicant = {
  name: string | null;
  handle: string | null;
  followers: number | null;
  niche: string | null;
};

const EMPTY_APPLICANT: Applicant = { name: null, handle: null, followers: null, niche: null };

function toApplication(
  row: ApplicationRow,
  contest: ContestFacts,
  applicant: Applicant = EMPTY_APPLICANT,
): ContestApplication {
  return {
    id: row.id,
    contestId: row.contest_id,
    contestTitle: contest.title,
    businessCategory: contest.businessCategory,
    applicationDeadline: contest.applicationDeadline,
    contestStatus: contest.status,
    influencerId: row.influencer_id,
    influencerName: applicant.name,
    influencerHandle: applicant.handle,
    influencerFollowers: applicant.followers,
    influencerNiche: applicant.niche,
    portfolioUrl: row.portfolio_url,
    contentIdea: row.content_idea,
    notes: row.notes,
    status: row.status,
    submittedAt: row.submitted_at,
    withdrawnAt: row.withdrawn_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchContestById(db: Db, contestId: string): Promise<Contest | null> {
  const { data, error } = await db
    .from("contests")
    .select(CONTEST_COLUMNS)
    .eq("id", contestId)
    .maybeSingle<ContestRow>();
  if (error) throw new Error(error.message);
  return data ? toContest(data) : null;
}

async function loadContestFacts(db: Db, contestIds: string[]): Promise<Map<string, ContestFacts>> {
  if (contestIds.length === 0) return new Map();
  const { data, error } = await db
    .from("contests")
    .select("id, title, business_category, application_deadline, status")
    .in("id", contestIds);
  if (error) throw new Error(error.message);
  return new Map(
    (data ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        title: row.title,
        businessCategory: row.business_category,
        applicationDeadline: row.application_deadline,
        status: row.status,
      } satisfies ContestFacts,
    ]),
  );
}

export async function loadApplicants(
  db: Db,
  userIds: string[],
): Promise<Map<string, Applicant>> {
  const map = new Map<string, Applicant>();
  if (userIds.length === 0) return map;
  const [{ data: profiles }, { data: creators }] = await Promise.all([
    db.from("profiles").select("id, full_name").in("id", userIds),
    db
      .from("creator_profiles")
      .select("user_id, display_name, handle, followers, niche")
      .in("user_id", userIds),
  ]);
  for (const p of profiles ?? []) {
    map.set(p.id, { name: p.full_name, handle: null, followers: null, niche: null });
  }
  for (const c of creators ?? []) {
    const existing = map.get(c.user_id);
    map.set(c.user_id, {
      name: c.display_name ?? existing?.name ?? null,
      handle: c.handle ?? null,
      followers: c.followers ?? null,
      niche: c.niche ?? null,
    });
  }
  return map;
}

export async function decorateApplications(
  db: Db,
  rows: ApplicationRow[],
  options: { withApplicants: boolean },
): Promise<ContestApplication[]> {
  if (rows.length === 0) return [];
  const contests = await loadContestFacts(db, [...new Set(rows.map((r) => r.contest_id))]);
  const applicants = options.withApplicants
    ? await loadApplicants(db, [...new Set(rows.map((r) => r.influencer_id))])
    : new Map<string, Applicant>();

  return rows.flatMap((row) => {
    const contest = contests.get(row.contest_id);
    if (!contest) return [];
    return [
      toApplication(row, contest, applicants.get(row.influencer_id) ?? EMPTY_APPLICANT),
    ];
  });
}

/* ------------------------------------------------------------------ */
/* Validation — the single source of truth for who may apply and when. */
/* ------------------------------------------------------------------ */

/** Contest lifecycle + application window. Reuses the discovery availability engine. */
export function checkContestAvailability(contest: Contest, now: Date = new Date()): ApplicationValidation {
  const availability = evaluateAvailability(contest, now);
  if (availability.state === "archived") return applicationFailure("contest_archived");
  if (contest.status !== "applications_open") return applicationFailure("applications_not_open");
  if (availability.state === "closed" || availability.state === "not_yet_open") {
    return applicationFailure("outside_application_window");
  }
  if (!availability.isOpen) return applicationFailure("applications_not_open");
  return { ok: true };
}

/** Profile-based eligibility. Reuses evaluateEligibility — no duplicated rules. */
export async function validateApplicationEligibility(
  db: Db,
  contest: Contest,
  influencerId: string,
  now: Date = new Date(),
): Promise<ApplicationValidation> {
  const profile = await loadInfluencerProfile(db, influencerId);
  const result = evaluateEligibility(contest, profile, now);
  return result.eligible ? { ok: true } : applicationFailure("not_eligible");
}

export async function checkDuplicateApplication(
  db: Db,
  contestId: string,
  influencerId: string,
): Promise<ApplicationValidation> {
  const { data, error } = await db
    .from("contest_applications")
    .select("id")
    .eq("contest_id", contestId)
    .eq("influencer_id", influencerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? applicationFailure("already_applied") : { ok: true };
}

/** Every rule in order, so callers never re-implement the sequence. */
export async function validateApplication(
  db: Db,
  contest: Contest,
  influencerId: string,
  now: Date = new Date(),
): Promise<ApplicationValidation> {
  const availability = checkContestAvailability(contest, now);
  if (!availability.ok) return availability;
  const duplicate = await checkDuplicateApplication(db, contest.id, influencerId);
  if (!duplicate.ok) return duplicate;
  return validateApplicationEligibility(db, contest, influencerId, now);
}

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export async function fetchMyApplication(
  db: Db,
  contestId: string,
  influencerId: string,
): Promise<ContestApplication | null> {
  const { data, error } = await db
    .from("contest_applications")
    .select(APPLICATION_COLUMNS)
    .eq("contest_id", contestId)
    .eq("influencer_id", influencerId)
    .maybeSingle<ApplicationRow>();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const [application] = await decorateApplications(db, [data], { withApplicants: false });
  return application ?? null;
}

type EventRow = {
  id: string;
  application_id: string;
  actor_id: string | null;
  event_type: string;
  note: string | null;
  created_at: string;
};

export async function fetchApplicationEvents(
  db: Db,
  applicationId: string,
): Promise<ApplicationEvent[]> {
  const { data, error } = await db
    .from("contest_application_events")
    .select("id, application_id, actor_id, event_type, note, created_at")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: true })
    .returns<EventRow[]>();
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const actorIds = [...new Set(rows.map((r) => r.actor_id).filter((v): v is string => Boolean(v)))];
  const names = new Map<string, string | null>();
  if (actorIds.length > 0) {
    const { data: profiles } = await db.from("profiles").select("id, full_name").in("id", actorIds);
    for (const p of profiles ?? []) names.set(p.id, p.full_name);
  }

  return rows.map((row) => ({
    id: row.id,
    applicationId: row.application_id,
    actorId: row.actor_id,
    actorName: row.actor_id ? (names.get(row.actor_id) ?? null) : null,
    eventType: row.event_type as ApplicationEventType,
    note: row.note,
    createdAt: row.created_at,
  }));
}

export function emptyCounts(): ApplicationSummaryCounts {
  const byStatus = Object.fromEntries(APPLICATION_STATUSES.map((s) => [s, 0])) as Record<
    ApplicationStatus,
    number
  >;
  return { total: 0, byStatus };
}

/**
 * Aggregate counts only. Callers must already have verified the requester owns
 * the contest or is an admin — no applicant rows ever leave this function.
 */
export async function countApplications(
  _db: Db,
  contestId: string,
): Promise<ApplicationSummaryCounts> {
  // Businesses cannot read applicant rows under RLS, so counting runs with the
  // admin client after the caller has been authorized.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("contest_applications")
    .select("status")
    .eq("contest_id", contestId);
  if (error) throw new Error(error.message);
  const counts = emptyCounts();
  for (const row of data ?? []) {
    counts.byStatus[row.status as ApplicationStatus] += 1;
    counts.total += 1;
  }
  return counts;
}


/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

export async function logApplicationEvent(
  db: Db,
  input: {
    applicationId: string;
    actorId: string;
    eventType: ApplicationEventType;
    note?: string | null;
  },
): Promise<void> {
  const { error } = await db.from("contest_application_events").insert({
    application_id: input.applicationId,
    actor_id: input.actorId,
    event_type: input.eventType,
    note: input.note ?? null,
  });
  if (error) throw new Error(error.message);
}

export function assertWithdrawable(
  application: ContestApplication,
  contest: Contest,
): ApplicationValidation {
  if (application.status === "withdrawn") return applicationFailure("already_withdrawn");
  if (!canWithdraw(application, contest.status)) {
    return applicationFailure("withdraw_window_closed");
  }
  return { ok: true };
}

export async function assertIsAdmin(db: Db, userId: string): Promise<boolean> {
  return isAdmin(db, userId);
}

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

type NotifyKind = "submitted" | "withdrawn";

/**
 * Cross-user notification writes need the admin client. Influencer, business
 * owner and every admin are notified from one place so copy stays consistent.
 */
export async function notifyApplicationActivity(input: {
  kind: NotifyKind;
  applicationId: string;
  contestId: string;
  contestTitle: string;
  businessId: string;
  influencerId: string;
  applicantName: string | null;
  totalApplications: number;
}): Promise<void> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const applicant = input.applicantName ?? "An influencer";

  const rows: {
    user_id: string;
    kind: "system";
    title: string;
    body: string;
    link: string;
  }[] = [];

  if (input.kind === "submitted") {
    rows.push({
      user_id: input.influencerId,
      kind: "system",
      title: "Application submitted",
      body: `Your application for "${input.contestTitle}" was submitted.`,
      link: `/app/entries/${input.applicationId}`,
    });
  } else {
    rows.push({
      user_id: input.influencerId,
      kind: "system",
      title: "Application withdrawn",
      body: `You withdrew your application for "${input.contestTitle}".`,
      link: `/app/entries/${input.applicationId}`,
    });
  }

  if (input.kind === "submitted") {
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    for (const admin of admins ?? []) {
      rows.push({
        user_id: admin.user_id,
        kind: "system",
        title: "New contest application",
        body: `${applicant} applied to "${input.contestTitle}".`,
        link: `/app/admin/contests/${input.contestId}`,
      });
    }
  }

  rows.push({
    user_id: input.businessId,
    kind: "system",
    title: "Application count updated",
    body: `"${input.contestTitle}" now has ${input.totalApplications} application${
      input.totalApplications === 1 ? "" : "s"
    }.`,
    link: `/app/business/contests/${input.contestId}`,
  });

  await supabaseAdmin.from("notifications").insert(rows);
}
