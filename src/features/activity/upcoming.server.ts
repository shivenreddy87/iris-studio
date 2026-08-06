import type { UpcomingAction } from "./types";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Next best actions for an influencer, ordered by urgency.
 * Everything links straight to the page that resolves the action.
 */
export async function getUpcomingActionsFor(userId: string): Promise<UpcomingAction[]> {
  const sb = await admin();
  const actions: UpcomingAction[] = [];

  const { data: profile } = await sb
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();
  if (!profile?.onboarding_completed_at) {
    actions.push({
      id: "complete-profile",
      title: "Complete your profile",
      description: "Finish your profile to unlock contest applications.",
      to: "/app/profile",
      priority: "high",
    });
  }

  // Payout details outstanding
  const { data: payouts } = await sb
    .from("payouts")
    .select("id, status, contest_id")
    .eq("influencer_id", userId)
    .in("status", ["details_requested", "waiting_for_details"]);
  for (const payout of payouts ?? []) {
    actions.push({
      id: `payout-${payout.id}`,
      title: "Complete payout details",
      description: "Submit your payment information so your reward can be released.",
      to: "/app/rewards",
      priority: "urgent",
    });
  }

  // Active participation without a submission
  const { data: participations } = await sb
    .from("contest_participants")
    .select("id, contest_id, participation_status")
    .eq("influencer_id", userId)
    .eq("participation_status", "active");
  const participantIds = (participations ?? []).map((p) => p.id as string);
  let submittedParticipants = new Set<string>();
  if (participantIds.length > 0) {
    const { data: submissions } = await sb
      .from("contest_submissions")
      .select("participant_id")
      .in("participant_id", participantIds);
    submittedParticipants = new Set((submissions ?? []).map((s) => s.participant_id as string));
  }
  for (const participation of participations ?? []) {
    if (submittedParticipants.has(participation.id as string)) continue;
    actions.push({
      id: `submit-${participation.id}`,
      title: "Submit contest content",
      description: "You are an active participant — upload your content link.",
      to: `/app/contests/${participation.contest_id}`,
      priority: "high",
    });
  }

  // Saved contests closing soon without an application
  const { data: saved } = await sb
    .from("saved_contests")
    .select("contest_id")
    .eq("influencer_id", userId);
  const savedIds = (saved ?? []).map((s) => s.contest_id as string);
  if (savedIds.length > 0) {
    const { data: applied } = await sb
      .from("contest_applications")
      .select("contest_id")
      .eq("influencer_id", userId)
      .in("contest_id", savedIds);
    const appliedIds = new Set((applied ?? []).map((a) => a.contest_id as string));
    const pending = savedIds.filter((id) => !appliedIds.has(id));
    if (pending.length > 0) {
      const { data: contests } = await sb
        .from("contests")
        .select("id, title, application_deadline, status")
        .in("id", pending)
        .in("status", ["published", "applications_open"]);
      for (const contest of contests ?? []) {
        actions.push({
          id: `apply-${contest.id}`,
          title: `Apply to "${contest.title}"`,
          description: contest.application_deadline
            ? `Applications close on ${contest.application_deadline}.`
            : "Applications are open for this saved contest.",
          to: `/app/contests/${contest.id}`,
          priority: "normal",
        });
      }
    }
  }

  const rank: Record<string, number> = { urgent: 0, high: 1, normal: 2, low: 3 };
  return actions.sort((a, b) => (rank[a.priority] ?? 9) - (rank[b.priority] ?? 9)).slice(0, 6);
}
