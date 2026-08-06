import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { decorateForInfluencer, loadInfluencerProfile } from "./discovery.server";
import { CONTEST_COLUMNS, decorate, type ContestRow } from "./contest.server";
import type { DiscoveryContest } from "./types";

/** Saves a contest for the signed-in influencer. Saving twice is a no-op. */
export const saveContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<{ saved: true }> => {
    const { error } = await context.supabase
      .from("saved_contests")
      .upsert(
        { contest_id: data.contestId, influencer_id: context.userId },
        { onConflict: "contest_id,influencer_id", ignoreDuplicates: true },
      );
    if (error) throw new Error(error.message);
    return { saved: true };
  });

export const unsaveContest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { contestId: string }) => data)
  .handler(async ({ data, context }): Promise<{ saved: false }> => {
    const { error } = await context.supabase
      .from("saved_contests")
      .delete()
      .eq("contest_id", data.contestId)
      .eq("influencer_id", context.userId);
    if (error) throw new Error(error.message);
    return { saved: false };
  });

/** Saved contests in the same enriched shape discovery returns. */
export const listSavedContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DiscoveryContest[]> => {
    const { data: saved, error } = await context.supabase
      .from("saved_contests")
      .select("contest_id, created_at")
      .eq("influencer_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const ids = (saved ?? []).map((r) => r.contest_id);
    if (ids.length === 0) return [];

    const { data: rows, error: contestError } = await context.supabase
      .from("contests")
      .select(CONTEST_COLUMNS)
      .in("id", ids)
      .returns<ContestRow[]>();
    if (contestError) throw new Error(contestError.message);

    const contests = await decorate(context.supabase, rows ?? []);
    const profile = await loadInfluencerProfile(context.supabase, context.userId);
    const order = new Map(ids.map((id, index) => [id, index]));
    return decorateForInfluencer(contests, profile, new Set(ids)).sort(
      (a, b) => (order.get(a.contest.id) ?? 0) - (order.get(b.contest.id) ?? 0),
    );
  });
