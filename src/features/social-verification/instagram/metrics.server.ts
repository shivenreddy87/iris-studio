/**
 * Best-effort verified metrics for a submitted Instagram Reel (server-only).
 * Read-only: nothing is ever written back to Instagram.
 */

export async function syncSubmissionMetricsFromInstagram(input: {
  userId: string;
  submissionId: string;
  contentUrl: string;
  platform: string;
}): Promise<boolean> {
  if (input.platform !== "instagram") return false;
  try {
    const { getInstagramToken } = await import("./link.server");
    const token = await getInstagramToken(input.userId);
    if (!token) return false;

    const { findMediaIdByPermalink, fetchMediaMetrics } = await import("./api.server");
    const mediaId = await findMediaIdByPermalink(token, input.contentUrl);
    if (!mediaId) return false;

    const metrics = await fetchMediaMetrics(token, mediaId);
    const views = metrics.views ?? metrics.reach ?? 0;
    const likes = metrics.likes ?? 0;
    const comments = metrics.comments ?? 0;
    const engagement = views > 0 ? Number((((likes + comments) / views) * 100).toFixed(2)) : 0;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("contest_submissions")
      .update({
        views,
        reach: metrics.reach ?? null,
        likes,
        comments,
        shares: metrics.shares ?? 0,
        engagement_rate: engagement,
        metrics_source: "instagram",
        metrics_status: "verified",
        metrics_last_synced_at: new Date().toISOString(),
      } as never)
      .eq("id", input.submissionId);
    return !error;
  } catch {
    // Manual verification stays the fallback whenever Instagram is unavailable.
    return false;
  }
}
