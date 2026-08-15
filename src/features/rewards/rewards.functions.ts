import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertNotSuspended } from "@/features/platform-admin/admin.server";
import { assertAdmin } from "@/features/contests/contest.server";
import { recordAdminAudit } from "@/lib/audit.server";
import type { RewardTier } from "./types";

const tierInputSchema = z.object({
  minimumViews: z.number().int().min(0),
  maximumViews: z.number().int().min(0).nullable(),
  rewardAmount: z.number().min(0),
});

export const getContestRewardTiers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ contestId: z.string().uuid() }).parse(data))
  .handler(async ({ data }): Promise<RewardTier[]> => {
    const { fetchRewardTiers } = await import("./rewards.server");
    return fetchRewardTiers(data.contestId);
  });

export const saveContestRewardTiers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ contestId: z.string().uuid(), tiers: z.array(tierInputSchema).min(1).max(20) })
      .parse(data),
  )
  .handler(async ({ context, data }): Promise<RewardTier[]> => {
    await assertAdmin(context.supabase, context.userId);
    await assertNotSuspended(context.userId);
    const { replaceRewardTiers } = await import("./rewards.server");
    const tiers = await replaceRewardTiers(data.contestId, data.tiers);
    await recordAdminAudit(context.userId, "contest", "contest.reward_tiers_updated", {
      entityId: data.contestId,
      newValues: { tiers: data.tiers },
    });
    return tiers;
  });
