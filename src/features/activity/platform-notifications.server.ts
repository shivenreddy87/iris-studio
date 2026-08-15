/**
 * Cross-feature notification rules introduced with the Creoinfo performance
 * model: social linking, blocked applications, metric verification and reward
 * tier progress. Everything routes through the shared notification engine so
 * user preferences, links and priorities stay consistent.
 */

import { createActivity, createNotification, notifyAdmins } from "./notification.server";

const formatViews = (views: number) => views.toLocaleString("en-IN");

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    amount,
  );

/** Influencer linked (or relinked) a social account. Admins get a review cue. */
export async function notifySocialAccountConnected(input: {
  userId: string;
  platformLabel: string;
  handle: string;
  isPrimary: boolean;
}): Promise<void> {
  await createActivity({
    actorId: input.userId,
    targetUserId: input.userId,
    action: "social_account.connected",
    entityType: "connected_account",
    summary: `${input.platformLabel} account @${input.handle} connected.`,
    metadata: { platform: input.platformLabel, isPrimary: input.isPrimary },
  });
  await createNotification({
    userId: input.userId,
    category: "system",
    title: `${input.platformLabel} account connected`,
    body: input.isPrimary
      ? `@${input.handle} is now your primary ${input.platformLabel} account. Request verification to unlock ${input.platformLabel} contests.`
      : `@${input.handle} was linked to your profile. Set it as primary to apply to ${input.platformLabel} contests.`,
    link: "/app/settings/social",
    actionLabel: "Open social accounts",
  });
  await notifyAdmins({
    category: "system",
    title: "Social account connected",
    body: `An influencer linked a ${input.platformLabel} account (@${input.handle}).`,
    link: "/app/admin/moderation",
    actionLabel: "Review verifications",
  });
}

/** An application attempt was refused by a server-side rule. */
export async function notifyApplicationBlocked(input: {
  userId: string;
  contestId: string;
  contestTitle: string;
  reason: string;
  code: string;
}): Promise<void> {
  await createActivity({
    actorId: input.userId,
    targetUserId: input.userId,
    action: "application.blocked",
    entityType: "contest",
    entityId: input.contestId,
    summary: `Application to “${input.contestTitle}” was blocked: ${input.reason}`,
    metadata: { code: input.code },
  });
  await createNotification({
    userId: input.userId,
    category: "contest",
    priority: "high",
    title: "Application blocked",
    body: `You could not apply to “${input.contestTitle}”. ${input.reason}`,
    link:
      input.code === "missing_primary_account"
        ? "/app/settings/social"
        : `/app/contests/${input.contestId}`,
    actionLabel:
      input.code === "missing_primary_account" ? "Connect account" : "Open contest",
  });
}

/** Verified performance metrics were recorded or corrected by an admin. */
export async function notifyMetricsUpdated(input: {
  influencerId: string;
  businessId: string;
  contestId: string;
  contestTitle: string;
  views: number;
}): Promise<void> {
  await createActivity({
    targetUserId: input.influencerId,
    action: "submission.metrics_updated",
    entityType: "contest",
    entityId: input.contestId,
    summary: `Verified metrics updated for “${input.contestTitle}”.`,
    metadata: { views: input.views },
  });
  await createNotification({
    userId: input.influencerId,
    category: "contest",
    title: "Verified metrics updated",
    body: `Your content for “${input.contestTitle}” is now recorded at ${formatViews(input.views)} verified views.`,
    link: `/app/contests/${input.contestId}`,
    actionLabel: "View performance",
  });
  await createNotification({
    userId: input.businessId,
    category: "contest",
    title: "Content performance updated",
    body: `Verified metrics were updated for content in “${input.contestTitle}”.`,
    link: `/app/business/contests/${input.contestId}`,
    actionLabel: "View contest",
  });
}

/** Verified views crossed into a higher reward tier. */
export async function notifyRewardTierReached(input: {
  influencerId: string;
  businessId: string;
  contestId: string;
  contestTitle: string;
  views: number;
  amount: number;
  currency: string;
}): Promise<void> {
  const money = formatMoney(input.amount, input.currency);
  await createActivity({
    targetUserId: input.influencerId,
    action: "reward.tier_reached",
    entityType: "contest",
    entityId: input.contestId,
    summary: `New reward tier reached in “${input.contestTitle}” (${money}).`,
    metadata: { views: input.views, amount: input.amount },
  });
  await createNotification({
    userId: input.influencerId,
    category: "payout",
    priority: "high",
    title: "New reward tier reached",
    body: `At ${formatViews(input.views)} verified views your content for “${input.contestTitle}” now sits in the ${money} tier. Final rewards are confirmed when the contest is completed.`,
    link: `/app/contests/${input.contestId}`,
    actionLabel: "View rewards",
  });
  await createNotification({
    userId: input.businessId,
    category: "contest",
    title: "Reward tier reached",
    body: `Content in “${input.contestTitle}” reached the ${money} performance tier.`,
    link: `/app/business/contests/${input.contestId}`,
    actionLabel: "View contest",
  });
  await notifyAdmins({
    category: "contest",
    title: "Reward tier reached",
    body: `“${input.contestTitle}” has content in the ${money} tier at ${formatViews(input.views)} verified views.`,
    link: `/app/admin/contests/${input.contestId}`,
    actionLabel: "Open evaluation",
  });
}
