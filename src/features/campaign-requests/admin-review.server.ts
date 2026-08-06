import type { AdminReviewSummary } from "./types";
import { type Db } from "./requests.server";

export {
  applyReviewTransition,
  assertAdmin,
  fetchRequestEvents,
  isAdmin,
  logRequestEvent,
  notifyBusinessOfDecision,
} from "./requests.server";

export async function requestOwnerInfo(
  db: Db,
  requestId: string,
): Promise<{ businessId: string; title: string } | null> {
  const { data } = await db
    .from("campaign_requests")
    .select("business_id, title")
    .eq("id", requestId)
    .maybeSingle<{ business_id: string; title: string }>();
  return data ? { businessId: data.business_id, title: data.title } : null;
}

export async function loadReviewSummary(db: Db): Promise<AdminReviewSummary> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const since = startOfDay.toISOString();

  const count = async (build: () => PromiseLike<{ count: number | null }>) =>
    (await build()).count ?? 0;

  const [pendingReview, approvedToday, rejectedToday, changesRequested] = await Promise.all([
    count(() =>
      db
        .from("campaign_requests")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review"]),
    ),
    count(() =>
      db
        .from("campaign_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("reviewed_at", since),
    ),
    count(() =>
      db
        .from("campaign_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "rejected")
        .gte("reviewed_at", since),
    ),
    count(() =>
      db
        .from("campaign_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "changes_requested"),
    ),
  ]);

  return { pendingReview, approvedToday, rejectedToday, changesRequested };
}
