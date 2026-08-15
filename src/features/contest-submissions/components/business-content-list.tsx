import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { DataSection } from "@/components/shared/data-section";
import { listBusinessContestContent } from "../submission.functions";

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Approved public content for the contest owner. Shows the live link and
 * verified performance only — no influencer contact, payout or profile data.
 */
export function BusinessContentList({ contestId }: { contestId: string }) {
  const fetchContent = useServerFn(listBusinessContestContent);
  const { data, isLoading } = useQuery({
    queryKey: ["business-contest-content", contestId],
    queryFn: () => fetchContent({ data: { contestId } }),
  });

  const items = data ?? [];

  return (
    <section className="rounded-2xl border border-hairline bg-surface-2 p-5">
      <h2 className="font-display text-lg font-bold text-ink">Contest content &amp; performance</h2>
      <p className="mt-1 text-sm text-ink-mute">
        Published content approved by our review team, with verified performance.
      </p>
      <DataSection
        loading={isLoading}
        isEmpty={items.length === 0}
        empty="No content has been approved for this contest yet."
      >
        <ul className="divide-y divide-hairline">
        {items.map((item) => (
          <li
            key={item.submissionId}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{item.creatorHandle}</p>
              <p className="text-xs text-ink-mute">
                {item.platform} · submitted {formatDate(item.submittedAt)}
              </p>
              <p className="mt-1 text-xs text-ink-dim">
                {item.metricsPending
                  ? "Metrics pending platform verification"
                  : `${item.verifiedViews?.toLocaleString("en-IN")} verified views${
                      item.engagementRate ? ` · ${item.engagementRate}% engagement` : ""
                    }`}
              </p>
            </div>
            <a
              href={item.contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-3"
            >
              View content <ExternalLink className="size-3.5" />
            </a>
          </li>
        ))}
      </ul>
    </DataSection>
  );
}
