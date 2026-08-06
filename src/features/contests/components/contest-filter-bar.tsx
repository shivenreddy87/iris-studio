import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/profiles/components/field";
import {
  CONTEST_STATUS_LABELS,
  DISCOVERABLE_STATUSES,
  type ContestDiscoveryFilters,
} from "../types";

export type DiscoveryFilterState = {
  platform: string;
  creatorCategory: string;
  location: string;
  status: ContestDiscoveryFilters["status"];
  minReward: string;
  maxReward: string;
  minFollowers: string;
  maxFollowers: string;
  deadlineBefore: string;
};

export const EMPTY_FILTERS: DiscoveryFilterState = {
  platform: "",
  creatorCategory: "",
  location: "",
  status: "all",
  minReward: "",
  maxReward: "",
  minFollowers: "",
  maxFollowers: "",
  deadlineBefore: "",
};

const numeric = (value: string) => (value.trim() === "" ? null : Number(value));

/** Maps UI filter state to the server-side filter contract. */
export function toDiscoveryFilters(state: DiscoveryFilterState): ContestDiscoveryFilters {
  return {
    platform: state.platform.trim() || undefined,
    creatorCategory: state.creatorCategory.trim() || undefined,
    location: state.location.trim() || undefined,
    status: state.status ?? "all",
    minReward: numeric(state.minReward),
    maxReward: numeric(state.maxReward),
    minFollowers: numeric(state.minFollowers),
    maxFollowers: numeric(state.maxFollowers),
    deadlineBefore: state.deadlineBefore.trim() || null,
  };
}

function Labelled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function ContestFilterBar({
  value,
  onChange,
  platforms,
  categories,
  locations,
}: {
  value: DiscoveryFilterState;
  onChange: (value: DiscoveryFilterState) => void;
  platforms: string[];
  categories: string[];
  locations: string[];
}) {
  const set = <K extends keyof DiscoveryFilterState>(key: K, next: DiscoveryFilterState[K]) =>
    onChange({ ...value, [key]: next });

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Labelled label="Platform">
          <select
            className={fieldClass}
            value={value.platform}
            onChange={(e) => set("platform", e.target.value)}
          >
            <option value="">All platforms</option>
            {platforms.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Labelled>

        <Labelled label="Creator category">
          <select
            className={fieldClass}
            value={value.creatorCategory}
            onChange={(e) => set("creatorCategory", e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Labelled>

        <Labelled label="Location">
          <select
            className={fieldClass}
            value={value.location}
            onChange={(e) => set("location", e.target.value)}
          >
            <option value="">All locations</option>
            {locations.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Labelled>

        <Labelled label="Contest status">
          <select
            className={fieldClass}
            value={value.status ?? "all"}
            onChange={(e) => set("status", e.target.value as ContestDiscoveryFilters["status"])}
          >
            <option value="all">All statuses</option>
            {DISCOVERABLE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTEST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Labelled>

        <Labelled label="Reward pool (min)">
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={value.minReward}
            onChange={(e) => set("minReward", e.target.value)}
          />
        </Labelled>
        <Labelled label="Reward pool (max)">
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={value.maxReward}
            onChange={(e) => set("maxReward", e.target.value)}
          />
        </Labelled>
        <Labelled label="Followers (min)">
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={value.minFollowers}
            onChange={(e) => set("minFollowers", e.target.value)}
          />
        </Labelled>
        <Labelled label="Followers (max)">
          <input
            type="number"
            min={0}
            className={fieldClass}
            value={value.maxFollowers}
            onChange={(e) => set("maxFollowers", e.target.value)}
          />
        </Labelled>
        <Labelled label="Deadline on or before">
          <input
            type="date"
            className={fieldClass}
            value={value.deadlineBefore}
            onChange={(e) => set("deadlineBefore", e.target.value)}
          />
        </Labelled>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange(EMPTY_FILTERS)}>
          Clear filters
        </Button>
      </div>
    </div>
  );
}
