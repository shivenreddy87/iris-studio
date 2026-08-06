import { createServerFn } from "@tanstack/react-start";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { canReadContest } from "@/features/contests/discovery.server";
import { evaluateAvailability, evaluateEligibility } from "@/features/contests/eligibility";
import { loadInfluencerProfile } from "@/features/contests/discovery.server";
import { applicationInputSchema, withdrawSchema } from "./application.schema";
import {
  APPLICATION_COLUMNS,
  assertIsAdmin,
  assertWithdrawable,
  countApplications,
  decorateApplications,
  emptyCounts,
  fetchApplicationEvents,
  fetchContestById,
  fetchMyApplication,
  logApplicationEvent,
  notifyApplicationActivity,
  validateApplication,
  type ApplicationRow,
} from "./application.server";
import {
  APPLICATION_ERROR_MESSAGES,
  type ApplicationContext,
  type ApplicationEvent,
  type ApplicationStatus,
  type ApplicationSummaryCounts,
  type ContestApplication,
} from "./types";

/** Influencer: everything the contest detail page needs for the apply panel. */
export const getApplicationContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ApplicationContext> => {
    const { supabase, userId } = context;
    const contest = await fetchContestById(supabase, data.contestId);
    if (!contest) throw new Error(APPLICATION_ERROR_MESSAGES.contest_not_found);
    if (!(await canReadContest(supabase, userId, contest))) {
      throw new Error(APPLICATION_ERROR_MESSAGES.forbidden);
    }

    const now = new Date();
    const profile = await loadInfluencerProfile(supabase, userId);
    const eligibility = evaluateEligibility(contest, profile, now);
    const availability = evaluateAvailability(contest, now);
    const application = await fetchMyApplication(supabase, contest.id, userId);
    const validation = await validateApplication(supabase, contest, userId, now);

    return {
      canApply: validation.ok,
      reason: validation.ok ? null : validation.code,
      reasonMessage: validation.ok ? null : validation.message,
      application,
      eligibility,
      availability,
    };
  });

/** Influencer: submit an application. Re-validates every rule server-side. */
export const applyToContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => applicationInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<ContestApplication> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    const contest = await fetchContestById(supabase, data.contestId);
    if (!contest) throw new Error(APPLICATION_ERROR_MESSAGES.contest_not_found);

    const validation = await validateApplication(supabase, contest, userId);
    if (!validation.ok) throw new Error(validation.message);

    const { data: row, error } = await supabase
      .from("contest_applications")
      .insert({
        contest_id: contest.id,
        influencer_id: userId,
        portfolio_url: data.portfolioUrl.trim(),
        content_idea: data.contentIdea.trim(),
        notes: data.notes?.trim() ? data.notes.trim() : null,
        status: "submitted",
      })
      .select(APPLICATION_COLUMNS)
      .maybeSingle<ApplicationRow>();
    if (error) {
      if (error.code === "23505") throw new Error(APPLICATION_ERROR_MESSAGES.already_applied);
      throw new Error(error.message);
    }
    if (!row) throw new Error("Could not submit your application. Please try again.");

    await logApplicationEvent(supabase, {
      applicationId: row.id,
      actorId: userId,
      eventType: "submitted",
    });

    const [application] = await decorateApplications(supabase, [row], { withApplicants: true });
    const counts = await countApplications(supabase, contest.id);
    await notifyApplicationActivity({
      kind: "submitted",
      applicationId: row.id,
      contestId: contest.id,
      contestTitle: contest.title,
      businessId: contest.businessId,
      influencerId: userId,
      applicantName: application?.influencerName ?? null,
      totalApplications: counts.total,
    });

    if (!application) throw new Error("Could not load your application.");
    return application;
  });

/** Influencer: withdraw an application while the contest is still open. */
export const withdrawApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => withdrawSchema.parse(data))
  .handler(async ({ data, context }): Promise<ContestApplication> => {
    await assertNotSuspended(context.userId);
    const { supabase, userId } = context;
    const { data: existing, error: readError } = await supabase
      .from("contest_applications")
      .select(APPLICATION_COLUMNS)
      .eq("id", data.applicationId)
      .maybeSingle<ApplicationRow>();
    if (readError) throw new Error(readError.message);
    if (!existing) throw new Error(APPLICATION_ERROR_MESSAGES.application_not_found);
    if (existing.influencer_id !== userId) throw new Error(APPLICATION_ERROR_MESSAGES.forbidden);

    const contest = await fetchContestById(supabase, existing.contest_id);
    if (!contest) throw new Error(APPLICATION_ERROR_MESSAGES.contest_not_found);

    const [current] = await decorateApplications(supabase, [existing], { withApplicants: false });
    if (!current) throw new Error(APPLICATION_ERROR_MESSAGES.application_not_found);
    const check = assertWithdrawable(current, contest);
    if (!check.ok) throw new Error(check.message);

    const { data: row, error } = await supabase
      .from("contest_applications")
      .update({ status: "withdrawn", withdrawn_at: new Date().toISOString() })
      .eq("id", data.applicationId)
      .eq("status", "submitted")
      .select(APPLICATION_COLUMNS)
      .maybeSingle<ApplicationRow>();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(APPLICATION_ERROR_MESSAGES.withdraw_window_closed);

    await logApplicationEvent(supabase, {
      applicationId: row.id,
      actorId: userId,
      eventType: "withdrawn",
      ...(data.note?.trim() ? { note: data.note.trim() } : {}),
    });

    const [application] = await decorateApplications(supabase, [row], { withApplicants: true });
    const counts = await countApplications(supabase, contest.id);
    await notifyApplicationActivity({
      kind: "withdrawn",
      applicationId: row.id,
      contestId: contest.id,
      contestTitle: contest.title,
      businessId: contest.businessId,
      influencerId: userId,
      applicantName: application?.influencerName ?? null,
      totalApplications: counts.total,
    });

    if (!application) throw new Error("Could not load your application.");
    return application;
  });

/** Influencer: My Applications list. */
export const listMyApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ContestApplication[]> => {
    const { data, error } = await context.supabase
      .from("contest_applications")
      .select(APPLICATION_COLUMNS)
      .eq("influencer_id", context.userId)
      .order("submitted_at", { ascending: false })
      .returns<ApplicationRow[]>();
    if (error) throw new Error(error.message);
    return decorateApplications(context.supabase, data ?? [], { withApplicants: false });
  });

/** Influencer: history for one of their own applications. */
export const getMyApplicationEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { applicationId: string }) => data)
  .handler(async ({ data, context }): Promise<ApplicationEvent[]> => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("contest_applications")
      .select("id, influencer_id")
      .eq("id", data.applicationId)
      .maybeSingle<{ id: string; influencer_id: string }>();
    if (error) throw new Error(error.message);
    if (!row) throw new Error(APPLICATION_ERROR_MESSAGES.application_not_found);
    if (row.influencer_id !== userId && !(await assertIsAdmin(supabase, userId))) {
      throw new Error(APPLICATION_ERROR_MESSAGES.forbidden);
    }
    return fetchApplicationEvents(supabase, data.applicationId);
  });

/** Admin: read-only applicant list for one contest. */
export const listContestApplications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string; status?: ApplicationStatus | "all" }) => data)
  .handler(async ({ data, context }): Promise<ContestApplication[]> => {
    const { supabase, userId } = context;
    if (!(await assertIsAdmin(supabase, userId))) {
      throw new Error(APPLICATION_ERROR_MESSAGES.forbidden);
    }
    let query = supabase
      .from("contest_applications")
      .select(APPLICATION_COLUMNS)
      .eq("contest_id", data.contestId);
    if (data.status && data.status !== "all") query = query.eq("status", data.status);
    const { data: rows, error } = await query
      .order("submitted_at", { ascending: false })
      .returns<ApplicationRow[]>();
    if (error) throw new Error(error.message);
    return decorateApplications(supabase, rows ?? [], { withApplicants: true });
  });

/** Contest owner or admin: aggregate counts only, never applicant identities. */
export const getContestApplicationCounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<ApplicationSummaryCounts> => {
    const { supabase, userId } = context;
    const contest = await fetchContestById(supabase, data.contestId);
    if (!contest) return emptyCounts();
    const allowed = contest.businessId === userId || (await assertIsAdmin(supabase, userId));
    if (!allowed) throw new Error(APPLICATION_ERROR_MESSAGES.forbidden);
    return countApplications(supabase, data.contestId);
  });
