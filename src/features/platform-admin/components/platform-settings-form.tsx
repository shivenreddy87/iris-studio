import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AnalyticsCard } from "@/features/analytics/components/analytics-card";
import type { PlatformSettings, PlatformSettingsValues } from "../types";

const NUMERIC_FIELDS: { key: keyof PlatformSettingsValues; label: string; hint: string }[] = [
  {
    key: "default_participant_limit",
    label: "Default participant limit",
    hint: "Pre-filled when a contest is created.",
  },
  { key: "default_winner_count", label: "Default winner count", hint: "Winners per contest." },
  { key: "minimum_reward", label: "Minimum reward", hint: "Lowest allowed reward pool." },
  { key: "maximum_reward", label: "Maximum reward", hint: "Highest allowed reward pool." },
  {
    key: "application_duration_days",
    label: "Application window (days)",
    hint: "Default days applications stay open.",
  },
  {
    key: "contest_duration_days",
    label: "Contest duration (days)",
    hint: "Default active contest length.",
  },
  {
    key: "payout_reminder_days",
    label: "Payout reminder (days)",
    hint: "Days before a pending payout is flagged as stale.",
  },
];

const NOTIFICATION_FIELDS: {
  key: keyof PlatformSettingsValues["notification_defaults"];
  label: string;
}[] = [
  { key: "email_enabled", label: "Email notifications" },
  { key: "in_app_enabled", label: "In-app notifications" },
  { key: "campaign_updates", label: "Campaign updates" },
  { key: "contest_updates", label: "Contest updates" },
  { key: "payout_updates", label: "Payout updates" },
  { key: "marketing", label: "Marketing" },
  { key: "system", label: "System" },
];

export function PlatformSettingsForm({
  settings,
  pending,
  onSave,
}: {
  settings: PlatformSettings;
  pending: boolean;
  onSave: (input: { settings: PlatformSettingsValues; note?: string }) => void;
}) {
  const [values, setValues] = useState<PlatformSettingsValues>(settings.settings);
  const [note, setNote] = useState("");

  useEffect(() => setValues(settings.settings), [settings]);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ settings: values, note: note.trim() || undefined });
        setNote("");
      }}
    >
      <AnalyticsCard
        title="Contest defaults"
        description={`Currently on version ${settings.version}. Saving creates a new version and keeps history.`}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NUMERIC_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type="number"
                min={0}
                value={String(values[field.key] ?? 0)}
                onChange={(event) =>
                  setValues((prev) => ({ ...prev, [field.key]: Number(event.target.value) }))
                }
              />
              <p className="text-xs text-ink-mute">{field.hint}</p>
            </div>
          ))}
        </div>
      </AnalyticsCard>

      <AnalyticsCard
        title="Notification defaults"
        description="Applied to new accounts. Existing preferences are untouched."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {NOTIFICATION_FIELDS.map((field) => (
            <label
              key={field.key}
              className="flex items-center justify-between gap-3 rounded-2xl border border-hairline bg-surface-1 px-4 py-3 text-sm text-ink"
            >
              {field.label}
              <Switch
                checked={values.notification_defaults[field.key]}
                onCheckedChange={(checked) =>
                  setValues((prev) => ({
                    ...prev,
                    notification_defaults: { ...prev.notification_defaults, [field.key]: checked },
                  }))
                }
              />
            </label>
          ))}
        </div>
      </AnalyticsCard>

      <AnalyticsCard title="Change note" description="Recorded with this settings version.">
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={3}
          placeholder="What changed and why?"
        />
        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={pending}>
            <Save className="size-4" /> Save settings
          </Button>
        </div>
      </AnalyticsCard>
    </form>
  );
}
