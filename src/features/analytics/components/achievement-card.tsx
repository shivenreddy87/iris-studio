import { Award, CheckCircle2, Crown, Repeat, Send, Trophy, UserCheck, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Achievement } from "../types";
import { formatDate } from "../chart.helpers";

const ICONS: Record<string, LucideIcon> = {
  send: Send,
  "user-check": UserCheck,
  trophy: Trophy,
  crown: Crown,
  zap: Zap,
  repeat: Repeat,
};

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const Icon = ICONS[achievement.icon ?? ""] ?? Award;
  return (
    <div
      className={`rounded-3xl border p-5 transition ${
        achievement.earned
          ? "border-violet/30 bg-violet/10"
          : "border-hairline bg-surface-2 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid size-10 place-items-center rounded-2xl ${
            achievement.earned ? "bg-violet/20 text-violet" : "bg-white/5 text-ink-mute"
          }`}
        >
          <Icon className="size-5" />
        </span>
        {achievement.earned ? <CheckCircle2 className="size-4 text-emerald-300" /> : null}
      </div>
      <p className="mt-4 font-display text-base font-semibold text-ink">{achievement.title}</p>
      <p className="mt-1 text-xs text-ink-dim">{achievement.description}</p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-ink-mute">
        {achievement.earned ? `Earned ${formatDate(achievement.earnedAt)}` : "Locked"}
      </p>
    </div>
  );
}

export function AchievementGrid({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.code} achievement={achievement} />
      ))}
    </div>
  );
}
