import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Award, ClipboardList, FileText, Lock, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/shared/page-header";
import { roleLabel, toPlatformRole } from "@/lib/roles";
import { ProfileCompletionCard } from "@/features/profiles/components/profile-completion-card";
import { profileCompletion } from "@/features/profiles/completion";
import { getMyProfile } from "@/features/profiles/profiles.functions";
import { listCampaignRequests } from "@/features/campaign-requests/requests.functions";
import { listOpenContests } from "@/features/contests/contests.functions";
import { listAllWinners, listMyWins } from "@/features/winner-selection/winner.functions";
import { listContests } from "@/features/contests/contest.functions";
import { getAdminReviewSummary } from "@/features/campaign-requests/admin-review.functions";
import { listMyContestEntries } from "@/features/contest-entries/entries.functions";
import {
  PlatformActivityCard,
  RecentActivityCard,
} from "@/features/activity/components/activity-feed-card";
import { UpcomingActionsCard } from "@/features/activity/components/upcoming-actions-card";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Project Eros" },
      {
        name: "description",
        content:
          "Your Project Eros workspace: campaign requests, contests and results at a glance.",
      },
      { property: "og:title", content: "Dashboard — Project Eros" },
      {
        property: "og:description",
        content:
          "Your Project Eros workspace: campaign requests, contests and results at a glance.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, role } = useAuth();
  const platformRole = toPlatformRole(role);

  const fetchRequests = useServerFn(listCampaignRequests);
  const fetchOpenContests = useServerFn(listOpenContests);
  const fetchEntries = useServerFn(listMyContestEntries);
  const fetchWins = useServerFn(listMyWins);

  const { data: requests = [] } = useQuery({
    queryKey: ["dashboard", "campaign-requests"],
    queryFn: () => fetchRequests(),
    enabled: platformRole === "business",
  });
  const { data: openContests = [] } = useQuery({
    queryKey: ["dashboard", "open-contests"],
    queryFn: () => fetchOpenContests(),
    enabled: platformRole === "influencer",
  });
  const { data: entries = [] } = useQuery({
    queryKey: ["dashboard", "entries"],
    queryFn: () => fetchEntries(),
    enabled: platformRole === "influencer",
  });
  const { data: wins = [] } = useQuery({
    queryKey: ["dashboard", "wins"],
    queryFn: () => fetchWins(),
    enabled: platformRole === "influencer",
  });

  const fetchAdminSummary = useServerFn(getAdminReviewSummary);
  const fetchAllContests = useServerFn(listContests);
  const fetchAllWinners = useServerFn(listAllWinners);

  const { data: adminSummary } = useQuery({
    queryKey: ["dashboard", "admin-summary"],
    queryFn: () => fetchAdminSummary(),
    enabled: platformRole === "admin",
  });
  const { data: allContests = [] } = useQuery({
    queryKey: ["dashboard", "all-contests"],
    queryFn: () => fetchAllContests(),
    enabled: platformRole === "admin",
  });
  const { data: allWinners = [] } = useQuery({
    queryKey: ["dashboard", "all-winners"],
    queryFn: () => fetchAllWinners(),
    enabled: platformRole === "admin",
  });

  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });
  const completion = profileCompletion(profile);
  const profileReady = platformRole === "admin" || completion.percent >= 100;

  const firstName = (user?.user_metadata?.full_name ?? user?.email ?? "there").split(/[\s@]/)[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow={`${roleLabel(role)} workspace`}
        title={`Good to see you, ${firstName}.`}
        description={
          platformRole === "business"
            ? "Submit campaign requests and follow them through review into live contests."
            : platformRole === "admin"
              ? "Review requests, run contests and declare winners."
              : "Find open contests, track your applications and see the ones you have won."
        }
      />

      {platformRole === "admin" ? null : (
        <div className="mb-6">
          <ProfileCompletionCard completion={completion} />
        </div>
      )}

      {!profileReady ? (
        <div className="flex items-start gap-3 rounded-3xl border border-hairline bg-surface-2 p-6">
          <Lock className="mt-0.5 size-5 shrink-0 text-violet" />
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              Finish your profile to unlock your workspace
            </p>
            <p className="mt-1 text-sm text-ink-dim">
              {platformRole === "business"
                ? "Campaign requests open up once your business profile is 100% complete."
                : "Contests and applications open up once your influencer profile is 100% complete."}
            </p>
          </div>
        </div>
      ) : null}

      <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${profileReady ? "" : "hidden"}`}>
        {platformRole === "business" ? (
          <StatCard
            icon={FileText}
            label="Campaign requests"
            value={requests.length}
            to="/app/business/requests"
          />
        ) : null}
        {platformRole === "influencer" ? (
          <>
            <StatCard
              icon={Trophy}
              label="Open contests"
              value={openContests.length}
              to="/app/contests"
            />
            <StatCard
              icon={ClipboardList}
              label="My applications"
              value={entries.length}
              to="/app/entries"
            />
            <StatCard
              icon={Award}
              label="Contests won"
              value={wins.length}
              to="/app/contests/won"
            />
          </>
        ) : null}
        {platformRole === "admin" ? (
          <>
            <StatCard
              icon={FileText}
              label="Requests to review"
              value={adminSummary?.pendingReview ?? 0}
              to="/app/admin/requests"
            />
            <StatCard
              icon={Trophy}
              label="Contests"
              value={allContests.length}
              to="/app/admin/contests"
            />
            <StatCard
              icon={Award}
              label="Winners"
              value={allWinners.length}
              to="/app/admin/winners"
            />
          </>
        ) : null}
      </div>

      <div className={`mt-6 grid gap-4 lg:grid-cols-2 ${profileReady ? "" : "hidden"}`}>
        {platformRole === "influencer" ? <UpcomingActionsCard /> : null}
        {platformRole === "admin" ? <PlatformActivityCard /> : <RecentActivityCard />}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  to: LinkProps["to"];
}) {
  return (
    <Link
      to={to}
      className="group rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm hover:border-violet/30"
    >
      <div className="mb-4 grid size-10 place-items-center rounded-xl bg-violet/10 text-violet">
        <Icon className="size-5" />
      </div>
      <p className="font-mono text-xs uppercase tracking-wider text-ink-mute">{label}</p>
      <p className="mt-1 font-display text-3xl font-bold text-ink">{value}</p>
    </Link>
  );
}
