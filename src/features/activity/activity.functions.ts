import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ActivityItem, UpcomingAction } from "./types";

/** Latest platform-wide events. Admins only. */
export const listPlatformActivityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(25) }).parse(d ?? {}))
  .handler(async ({ context, data }): Promise<ActivityItem[]> => {
    const { assertAdmin } = await import("@/features/contests/contest.server");
    await assertAdmin(context.supabase, context.userId);
    const { listPlatformActivity } = await import("./activity.server");
    return listPlatformActivity(data.limit);
  });

/** Activity relevant to the signed-in user (their own actions and events targeting them). */
export const listMyActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ limit: z.number().int().min(1).max(50).default(10) }).parse(d ?? {}))
  .handler(async ({ context, data }): Promise<ActivityItem[]> => {
    const { listUserActivity } = await import("./activity.server");
    return listUserActivity(context.userId, data.limit);
  });

export const getUpcomingActions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UpcomingAction[]> => {
    const { getUpcomingActionsFor } = await import("./upcoming.server");
    return getUpcomingActionsFor(context.userId);
  });
