import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fieldClass } from "@/features/profiles/components/field";
import { getContestRewardTiers, saveContestRewardTiers } from "../rewards.functions";
import { formatTierRange, sortTiers, validateRewardTiers } from "../reward-calculation";
import type { RewardTierInput } from "../types";

export const rewardTierKeys = {
  list: (contestId: string) => ["reward-tiers", contestId] as const,
};

const BLANK: RewardTierInput = { minimumViews: 0, maximumViews: null, rewardAmount: 0 };

function num(value: string): number {
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Performance reward ladder for a contest. Rewards are earned per verified view
 * band — they are not a fixed prize, and nothing pays out until views are verified.
 */
export function RewardTierEditor({ contestId, readOnly }: { contestId: string; readOnly?: boolean }) {
  const queryClient = useQueryClient();
  const fetchTiers = useServerFn(getContestRewardTiers);
  const saveTiers = useServerFn(saveContestRewardTiers);
  const [tiers, setTiers] = useState<RewardTierInput[]>([]);
  const [dirty, setDirty] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: rewardTierKeys.list(contestId),
    queryFn: () => fetchTiers({ data: { contestId } }),
  });

  useEffect(() => {
    if (data && !dirty) {
      setTiers(
        data.map((tier) => ({
          minimumViews: tier.minimumViews,
          maximumViews: tier.maximumViews,
          rewardAmount: tier.rewardAmount,
        })),
      );
    }
  }, [data, dirty]);

  const validation = validateRewardTiers(tiers);

  const save = useMutation({
    mutationFn: () => saveTiers({ data: { contestId, tiers } }),
    onSuccess: () => {
      toast.success("Reward tiers saved");
      setDirty(false);
      void queryClient.invalidateQueries({ queryKey: rewardTierKeys.list(contestId) });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function update(index: number, patch: Partial<RewardTierInput>) {
    setDirty(true);
    setTiers((current) => current.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  }

  function add() {
    setDirty(true);
    setTiers((current) => {
      const last = sortTiers(current)[current.length - 1];
      const start = last ? (last.maximumViews === null ? last.minimumViews : last.maximumViews) + 1 : 0;
      return [...current, { ...BLANK, minimumViews: start }];
    });
  }

  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-ink">Performance reward tiers</h3>
          <p className="mt-1 max-w-xl text-sm text-ink-mute">
            Influencers earn the amount for the view band their verified content reaches. Tiers must
            not overlap; leave the highest tier&apos;s maximum empty to make it open-ended.
          </p>
        </div>
        {!readOnly ? (
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="mr-2 size-4" /> Add tier
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-6 text-sm text-ink-mute">Loading tiers…</p>
      ) : tiers.length === 0 ? (
        <p className="mt-6 text-sm text-ink-mute">
          No reward tiers yet. Add at least one band before publishing.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {tiers.map((tier, index) => (
            <li
              key={index}
              className="grid gap-3 rounded-2xl border border-hairline p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
            >
              <label className="block text-xs text-ink-mute">
                Minimum views
                <input
                  type="number"
                  min={0}
                  disabled={readOnly}
                  className={`${fieldClass} mt-1`}
                  value={tier.minimumViews}
                  onChange={(event) => update(index, { minimumViews: num(event.target.value) })}
                />
              </label>
              <label className="block text-xs text-ink-mute">
                Maximum views (blank = open-ended)
                <input
                  type="number"
                  min={0}
                  disabled={readOnly}
                  className={`${fieldClass} mt-1`}
                  value={tier.maximumViews ?? ""}
                  onChange={(event) =>
                    update(index, {
                      maximumViews: event.target.value === "" ? null : num(event.target.value),
                    })
                  }
                />
              </label>
              <label className="block text-xs text-ink-mute">
                Reward (₹)
                <input
                  type="number"
                  min={0}
                  disabled={readOnly}
                  className={`${fieldClass} mt-1`}
                  value={tier.rewardAmount}
                  onChange={(event) => update(index, { rewardAmount: num(event.target.value) })}
                />
              </label>
              {!readOnly ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove tier ${index + 1}`}
                  onClick={() => {
                    setDirty(true);
                    setTiers((current) => current.filter((_, i) => i !== index));
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              ) : (
                <span className="text-xs text-ink-mute">{formatTierRange(tier)}</span>
              )}
            </li>
          ))}
        </ul>
      )}

      {!validation.ok && tiers.length > 0 ? (
        <ul className="mt-4 space-y-1 text-xs text-rose">
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {!readOnly ? (
        <div className="mt-6 flex justify-end">
          <Button
            type="button"
            size="sm"
            disabled={!validation.ok || save.isPending}
            onClick={() => save.mutate()}
          >
            <Save className="mr-2 size-4" /> Save tiers
          </Button>
        </div>
      ) : null}
    </div>
  );
}
