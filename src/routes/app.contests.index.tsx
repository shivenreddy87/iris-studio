import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import { ProfileGate } from "@/features/profiles/components/profile-gate";
import { listDiscoverableContests } from "@/features/contests/discovery.functions";
import { ContestDiscoveryCard } from "@/features/contests/components/contest-discovery-card";
import { ContestSearch } from "@/features/contests/components/contest-search";
import { ContestSort } from "@/features/contests/components/contest-sort";
import {
  ContestFilterBar,
  EMPTY_FILTERS,
  toDiscoveryFilters,
  type DiscoveryFilterState,
} from "@/features/contests/components/contest-filter-bar";
import type { ContestSortKey } from "@/features/contests/types";

export const Route = createFileRoute("/app/contests/")({
  head: () => ({
    meta: [
      { title: "Available Contests — Project Eros" },
      {
        name: "description",
        content: "Discover published contests, filter by reward, platform and audience fit.",
      },
      { property: "og:title", content: "Available Contests — Project Eros" },
      {
        property: "og:description",
        content: "Discover published contests, filter by reward, platform and audience fit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <ProfileGate>
      <AvailableContestsPage />
    </ProfileGate>
  ),
});

const PAGE_SIZE = 12;

function AvailableContestsPage() {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ContestSortKey>("newest");
  const [filters, setFilters] = useState<DiscoveryFilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);

  const fetchDiscovery = useServerFn(listDiscoverableContests);
  const serverFilters = useMemo(() => toDiscoveryFilters(filters), [filters]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["contests", "discovery", { search, sort, serverFilters, page }],
    queryFn: () =>
      fetchDiscovery({
        data: { ...serverFilters, search, sort, page, pageSize: PAGE_SIZE },
      }),
    placeholderData: keepPreviousData,
  });

  // Facets come from the unfiltered pool so options never disappear mid-search.
  const { data: facetPage } = useQuery({
    queryKey: ["contests", "discovery", "facets"],
    queryFn: () => fetchDiscovery({ data: { pageSize: 50, page: 1 } }),
  });

  const facets = useMemo(() => {
    const contests = (facetPage?.items ?? []).map((i) => i.contest);
    const uniq = (values: (string | null)[]) =>
      [...new Set(values.filter((v): v is string => Boolean(v && v.trim())))].sort();
    return {
      platforms: uniq(contests.map((c) => c.targetPlatform)),
      categories: uniq(contests.map((c) => c.preferredCreatorCategory)),
      locations: uniq(contests.map((c) => c.targetLocation)),
    };
  }, [facetPage]);

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const update =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <PageHeader
        eyebrow="Influencer"
        title="Available Contests"
        description="Published contests you can explore now. Applications open in the next milestone."
        actions={
          <Button variant="outline" asChild>
            <Link to="/app/contests/saved">
              <Bookmark className="size-4" />
              Saved contests
            </Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <ContestSearch value={search} onChange={update(setSearch)} />
        <ContestSort value={sort} onChange={update(setSort)} />
      </div>

      <div className="mb-6">
        <ContestFilterBar
          value={filters}
          onChange={update<DiscoveryFilterState>(setFilters)}
          platforms={facets.platforms}
          categories={facets.categories}
          locations={facets.locations}
        />
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={items.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="No contests match your filters"
            hint="Clear a filter or widen your search to see more published contests."
          />
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <ContestDiscoveryCard key={item.contest.id} item={item} />
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            {total} contest{total === 1 ? "" : "s"} · page {data?.page ?? 1} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(data?.page ?? 1) <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(data?.page ?? 1) >= pageCount}
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </DataSection>
    </div>
  );
}
