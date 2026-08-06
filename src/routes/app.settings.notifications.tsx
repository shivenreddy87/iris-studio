import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/features/activity/notification.functions";
import type { NotificationPreferences } from "@/features/activity/types";

export const Route = createFileRoute("/app/settings/notifications")({
  head: () => ({
    meta: [
      { title: "Notification preferences — Project Eros" },
      {
        name: "description",
        content: "Choose which campaign, contest and payout updates reach you on Project Eros.",
      },
      { property: "og:title", content: "Notification preferences — Project Eros" },
      {
        property: "og:description",
        content: "Choose which campaign, contest and payout updates reach you on Project Eros.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationPreferencesPage,
});

type ToggleKey = Exclude<keyof NotificationPreferences, "userId">;

const TOGGLES: { key: ToggleKey; title: string; description: string }[] = [
  {
    key: "inAppEnabled",
    title: "In-app notifications",
    description: "Master switch for the bell and the notifications page.",
  },
  {
    key: "emailEnabled",
    title: "Email notifications",
    description: "Send important updates to your email once delivery is enabled.",
  },
  {
    key: "campaignUpdates",
    title: "Campaign requests",
    description: "Review decisions, change requests and approvals.",
  },
  {
    key: "contestUpdates",
    title: "Contests",
    description: "Applications, selections, submissions and results.",
  },
  {
    key: "payoutUpdates",
    title: "Payouts",
    description: "Reward details requests and payment status changes.",
  },
  { key: "system", title: "System", description: "Account, security and platform announcements." },
  {
    key: "marketing",
    title: "Product news",
    description: "Occasional tips and feature announcements.",
  },
];

function NotificationPreferencesPage() {
  const queryClient = useQueryClient();
  const fetchPrefs = useServerFn(getNotificationPreferences);
  const savePrefs = useServerFn(updateNotificationPreferences);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => fetchPrefs(),
  });

  const update = useMutation({
    mutationFn: (patch: Partial<Record<ToggleKey, boolean>>) => {
      const current = prefs ?? {
        emailEnabled: true,
        inAppEnabled: true,
        campaignUpdates: true,
        contestUpdates: true,
        payoutUpdates: true,
        marketing: false,
        system: true,
      };
      const { userId: _userId, ...rest } = current as NotificationPreferences;
      return savePrefs({ data: { ...rest, ...patch } });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["notification-preferences"] });
      toast.success("Preferences saved");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <Link
        to="/app/settings"
        className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-mute hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> Settings
      </Link>
      <PageHeader
        eyebrow="Settings"
        title="Notification preferences"
        description="Choose what you hear about. Critical account and security messages are always delivered."
      />

      {isLoading || !prefs ? (
        <div className="rounded-3xl border border-hairline bg-surface-2 p-8 text-center text-sm text-ink-mute">
          Loading preferences…
        </div>
      ) : (
        <div className="divide-y divide-hairline overflow-hidden rounded-3xl border border-hairline bg-surface-2">
          {TOGGLES.map((toggle) => {
            const value = prefs[toggle.key];
            const disabled =
              update.isPending ||
              (!prefs.inAppEnabled &&
                toggle.key !== "inAppEnabled" &&
                toggle.key !== "emailEnabled");
            return (
              <div key={toggle.key} className="flex items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-bold text-ink">{toggle.title}</p>
                  <p className="text-xs text-ink-mute">{toggle.description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  aria-label={toggle.title}
                  disabled={disabled}
                  onClick={() => update.mutate({ [toggle.key]: !value })}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-40 ${
                    value ? "bg-violet" : "bg-white/15"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                      value ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
