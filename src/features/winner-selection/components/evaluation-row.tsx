import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { money } from "@/features/contests/components/detail-row";
import { calculateEngagementRate, calculatePerformanceScore } from "../scoring";
import { markWinner, removeWinner, updateSubmissionMetrics } from "../winner.functions";
import type { EvaluationBoard, EvaluationEntry } from "../types";
import { WinnerBadge } from "./winner-badge";

type Metrics = {
  views: string;
  likes: string;
  comments: string;
  shares: string;
  reviewScore: string;
};

function toMetrics(entry: EvaluationEntry): Metrics {
  return {
    views: String(entry.views ?? 0),
    likes: String(entry.likes ?? 0),
    comments: String(entry.comments ?? 0),
    shares: String(entry.shares ?? 0),
    reviewScore: entry.reviewScore === null ? "" : String(entry.reviewScore),
  };
}

const n = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

/** One verified submission: metric entry, live score preview and winner actions. */
export function EvaluationRow({
  entry,
  board,
  onChanged,
}: {
  entry: EvaluationEntry;
  board: EvaluationBoard;
  onChanged: (next: EvaluationBoard) => void;
}) {
  const [metrics, setMetrics] = useState<Metrics>(() => toMetrics(entry));
  const [notes, setNotes] = useState(entry.reviewNotes ?? "");
  const [rank, setRank] = useState(String(entry.winnerRank ?? entry.rank ?? 1));
  const [reward, setReward] = useState(
    entry.rewardAmount !== null ? String(entry.rewardAmount) : String(board.defaultReward ?? ""),
  );
  const [manualScore, setManualScore] = useState(
    entry.manualScore === null ? "" : String(entry.manualScore),
  );
  const [justification, setJustification] = useState(entry.winnerNotes ?? "");

  const saveMetrics = useServerFn(updateSubmissionMetrics);
  const select = useServerFn(markWinner);
  const withdraw = useServerFn(removeWinner);

  const preview = useMemo(() => {
    const parsed = {
      views: n(metrics.views),
      likes: n(metrics.likes),
      comments: n(metrics.comments),
      shares: n(metrics.shares),
      reviewScore: metrics.reviewScore === "" ? null : n(metrics.reviewScore),
    };
    return {
      engagementRate: calculateEngagementRate(parsed),
      score: calculatePerformanceScore(parsed, { requiredViews: board.contest.requiredViews }),
    };
  }, [metrics, board.contest.requiredViews]);

  const metricsMutation = useMutation({
    mutationFn: () =>
      saveMetrics({
        data: {
          submissionId: entry.submissionId,
          views: n(metrics.views),
          likes: n(metrics.likes),
          comments: n(metrics.comments),
          shares: n(metrics.shares),
          reviewScore: metrics.reviewScore === "" ? null : n(metrics.reviewScore),
          reviewNotes: notes.trim() || null,
        },
      }),
    onSuccess: (next) => {
      toast.success("Metrics saved");
      onChanged(next);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const winnerMutation = useMutation({
    mutationFn: () =>
      select({
        data: {
          submissionId: entry.submissionId,
          rank: Number(rank),
          rewardAmount: reward === "" ? null : Number(reward),
          manualScore: manualScore === "" ? null : Number(manualScore),
          winnerNotes: justification.trim() || null,
        },
      }),
    onSuccess: (next) => {
      toast.success("Winner selected");
      onChanged(next);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const removeMutation = useMutation({
    mutationFn: () => withdraw({ data: { submissionId: entry.submissionId } }),
    onSuccess: (next) => {
      toast.success("Winner removed");
      onChanged(next);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const busy = metricsMutation.isPending || winnerMutation.isPending || removeMutation.isPending;

  return (
    <article className="rounded-3xl border border-hairline bg-surface-2 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Rank #{entry.rank} · {entry.platform}
          </p>
          <h4 className="mt-1 truncate font-display text-base font-semibold text-ink">
            {entry.influencerName ?? "Influencer"}
            {entry.influencerHandle ? (
              <span className="ml-2 text-sm font-normal text-ink-mute">
                @{entry.influencerHandle}
              </span>
            ) : null}
          </h4>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-ink-mute">
            <a
              href={entry.contentUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-violet hover:underline"
            >
              Submission <ExternalLink className="size-3" />
            </a>
            {entry.portfolioUrl ? (
              <a
                href={entry.portfolioUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 hover:underline"
              >
                Portfolio <ExternalLink className="size-3" />
              </a>
            ) : null}
            <span>Submitted {new Date(entry.submittedAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="text-right">
          {entry.isWinner ? <WinnerBadge rank={entry.winnerRank} /> : null}
          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
            Score
          </p>
          <p className="text-2xl font-medium text-ink">{preview.score}</p>
          <p className="text-xs text-ink-mute">{preview.engagementRate}% engagement</p>
        </div>
      </header>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {(
          [
            ["views", "Views"],
            ["likes", "Likes"],
            ["comments", "Comments"],
            ["shares", "Shares"],
            ["reviewScore", "Quality /10"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-1.5">
            <Label className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
              {label}
            </Label>
            <Input
              inputMode="numeric"
              value={metrics[key]}
              disabled={board.isLocked || busy}
              onChange={(event) =>
                setMetrics((current) => ({ ...current, [key]: event.target.value }))
              }
            />
          </div>
        ))}
      </div>

      <div className="mt-3 space-y-1.5">
        <Label className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
          Review notes
        </Label>
        <Textarea
          rows={2}
          value={notes}
          disabled={board.isLocked || busy}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Observations about this submission (optional)"
        />
      </div>

      {board.isLocked ? (
        <p className="mt-4 text-xs text-ink-mute">
          Results are final.{" "}
          {entry.rewardAmount !== null ? `Reward ${money(entry.rewardAmount)}.` : ""}
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => metricsMutation.mutate()}
            >
              Save metrics
            </Button>
            {entry.isWinner ? (
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => removeMutation.mutate()}
              >
                Remove winner
              </Button>
            ) : null}
          </div>

          {!entry.isWinner ? (
            <div className="rounded-2xl border border-hairline bg-surface-3 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">
                Declare winner
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-ink-mute">Rank</Label>
                  <Input
                    inputMode="numeric"
                    value={rank}
                    disabled={busy}
                    onChange={(event) => setRank(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-ink-mute">Reward</Label>
                  <Input
                    inputMode="numeric"
                    value={reward}
                    disabled={busy}
                    onChange={(event) => setReward(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-ink-mute">Score override</Label>
                  <Input
                    inputMode="numeric"
                    value={manualScore}
                    disabled={busy}
                    placeholder="Optional"
                    onChange={(event) => setManualScore(event.target.value)}
                  />
                </div>
              </div>
              {manualScore !== "" ? (
                <div className="mt-3 space-y-1.5">
                  <Label className="text-xs text-ink-mute">Justification (required)</Label>
                  <Textarea
                    rows={2}
                    value={justification}
                    disabled={busy}
                    onChange={(event) => setJustification(event.target.value)}
                    placeholder="Why is the calculated score being overridden?"
                  />
                </div>
              ) : null}
              <Button
                size="sm"
                className="mt-3"
                disabled={busy || board.winnersSelected >= board.winnerCount}
                onClick={() => winnerMutation.mutate()}
              >
                Mark winner
              </Button>
              {board.winnersSelected >= board.winnerCount ? (
                <p className="mt-2 text-xs text-ink-mute">
                  All {board.winnerCount} winner slots are filled.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}
