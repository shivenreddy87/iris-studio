import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { DataSection } from "@/components/shared/data-section";
import { EmptyState } from "@/components/ui/list-skeleton";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/profiles/components/field";
import { listContests } from "@/features/contests/contest.functions";
import { contestKeys } from "@/features/contests/hooks/use-contests";
import { ContestList } from "@/features/contests/components/contest-list";
import { CONTEST_STATUSES, CONTEST_STATUS_LABELS } from "@/features/contests/types";

export const Route = createFileRoute("/app/admin/contests/")({
  head: () => ({
    meta: [
      { title: "Contests — Project Eros Admin" },
      {
        name: "description",
        content: "Create and manage contests across every stage of their lifecycle.",
      },
      { property: "og:title", content: "Contests — Project Eros Admin" },
      {
        property: "og:description",
        content: "Create and manage contests across every stage of their lifecycle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminContestsPage,
});

function AdminContestsPage() {
  const fetchItems = useServerFn(listContests);
  const [search, setSearch] = useState("");
  const {
    data = [],
    isLoading,
    error,
  } = useQuery({ queryKey: contestKeys.all, queryFn: () => fetchItems() });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(
      (contest) =>
        contest.title.toLowerCase().includes(term) ||
        (contest.businessName ?? "").toLowerCase().includes(term) ||
        (contest.approvalReference ?? "").toLowerCase().includes(term),
    );
  }, [data, search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <PageHeader
        eyebrow="Admin"
        title="Contests"
        description="Every contest on the platform, from draft through judging to completion."
        actions={
          <Button asChild>
            <Link to="/app/admin/contests/new">
              <Plus className="size-4" /> New contest
            </Link>
          </Button>
        }
      />

      <div className="mb-6">
        <input
          className={fieldClass}
          placeholder="Search by contest, business or approval reference"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      <DataSection
        loading={isLoading}
        error={error}
        isEmpty={filtered.length === 0}
        empty={
          <EmptyState
            icon={<Trophy className="size-8" />}
            title="No contests yet"
            hint="Create a contest from an approved campaign request to get started."
          />
        }
      >
        <div className="space-y-10">
          {CONTEST_STATUSES.map((status) => {
            const items = filtered.filter((contest) => contest.status === status);
            if (items.length === 0) return null;
            return (
              <section key={status}>
                <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                  {CONTEST_STATUS_LABELS[status]}
                  <span className="ml-2 text-sm font-normal text-ink-mute">{items.length}</span>
                </h2>
                <ContestList contests={items} />
              </section>
            );
          })}
        </div>
      </DataSection>
    </div>
  );
}
