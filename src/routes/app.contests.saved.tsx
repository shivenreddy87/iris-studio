import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { listSavedContests } from "@/features/contests/saved.functions";
import { ContestDiscoveryCard } from "@/features/contests/components/contest-discovery-card";
import { ContestSearch } from "@/features/contests/components/contest-search";
import { ContestSort } from "@/features/contests/components/contest-sort";
import type { ContestSortKey, DiscoveryContest } from "@/features/contests/types";

export const Route = createFileRoute("/app/contests/saved")({
  head: () => ({
    meta: [
      { title: "Saved Contests — Creoinfo" },
      { name: "description", content: "Contests you bookmarked while browsing discovery." },
      { property: "og:title", content: "Saved Contests — Creoinfo" },
      {
        property: "og:description",
        content: "Contests you bookmarked while browsing discovery.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <SavedContestsPage />
    </ProfileGate>
  ),
});

const time = (v: string | null) => (v ? new Date(v).getTime() : Number.POSITIVE_INFINITY);

function sortItems(items: DiscoveryContest[], sort: ContestSortKey) {
  const sorted = [...items];
  switch (sort) {
    case "highest_reward":
      return sorted.sort((a, b) => (b.contest.rewardPool ?? 0) - (a.contest.rewardPool ?? 0));
    case "earliest_deadline":
      return sorted.sort(
        (a, b) => time(a.contest.applicationDeadline) - time(b.contest.applicationDeadline),
      );
    case "contest_start":
      return sorted.sort(
        (a, b) => time(a.contest.contestStartDate) - time(b.contest.contestStartDate),
      );
    default:
      return sorted;
  }
}

function SavedContestsPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ContestSortKey>("newest");
  const fetchSaved = useServerFn(listSavedContests);

  const {
    data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["contests", "saved"],
    queryFn: () => fetchSaved(),
  });

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? data.filter((item) =>
          [item.contest.title, item.contest.campaignGoal, item.contest.businessCategory]
            .map((v) => (v ?? "").toLowerCase())
            .join(" ")
            .includes(q),
        )
      : data;
    return sortItems(filtered, sort);
  }, [data, search, sort]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Influencer"
        title="Saved Contests"
        description="Everything you bookmarked while browsing available contests."
        actions={
          <Button variant="outline" asChild>
            <Link to="/app/contests">
              <Trophy className="size-4" />
              Browse contests
            </Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <ContestSearch value={search} onChange={setSearch} placeholder="Search saved contests" />
        <ContestSort value={sort} onChange={setSort} />
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            icon={<Bookmark className="size-8" />}
            title="No saved contests yet"
            hint="Save a contest from discovery and it will appear here."
          />
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <ContestDiscoveryCard key={item.contest.id} item={item} />
          ))}
        </div>
      </DataSection>
    </div>
  );
}
