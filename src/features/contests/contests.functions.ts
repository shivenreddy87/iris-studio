import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTEST_COLUMNS, decorate, type ContestRow } from "./contest.server";
import type { Contest } from "./types";

/** Contests currently accepting applications. */
export const listOpenContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Contest[]> => {
    const { data, error } = await context.supabase
      .from("contests")
      .select(CONTEST_COLUMNS)
      .eq("status", "applications_open")
      .order("application_deadline", { ascending: true })
      .returns<ContestRow[]>();
    if (error) throw new Error(error.message);
    return decorate(context.supabase, data ?? []);
  });

/** Influencer: contests they are an active participant in and that are running. */
export const listMyActiveContests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Contest[]> => {
    const { supabase, userId } = context;
    const { data: participants, error: participantError } = await supabase
      .from("contest_participants")
      .select("contest_id")
      .eq("influencer_id", userId)
      .eq("participation_status", "active");
    if (participantError) throw new Error(participantError.message);

    const ids = [...new Set((participants ?? []).map((row) => row.contest_id as string))];
    if (ids.length === 0) return [];

    const { data, error } = await supabase
      .from("contests")
      .select(CONTEST_COLUMNS)
      .in("id", ids)
      .eq("status", "live")
      .order("contest_start_date", { ascending: true })
      .returns<ContestRow[]>();
    if (error) throw new Error(error.message);
    return decorate(supabase, data ?? []);
  });
