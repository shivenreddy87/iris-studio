import { createFileRoute, Link } from "@tanstack/react-router";
import type { LinkProps } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { UserCircle, ShieldCheck, ArrowRight, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings/")({
  head: () => ({
    meta: [
      { title: "Settings — Project Eros" },
      {
        name: "description",
        content: "Manage your account, profile and notification preferences on Project Eros.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, role } = useAuth();

  async function handleReset() {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Password reset email sent");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-ink-mute">Settings</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">Your account</h1>
      </div>
      <div className="space-y-6">
        <Section title="Profile">
          <Row label="Name" value={user?.user_metadata?.full_name ?? "—"} />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Role" value={role ?? "—"} />
        </Section>

        <div className="grid gap-3 sm:grid-cols-2">
          <NavCard
            to="/app/profile"
            Icon={UserCircle}
            title="Profile"
            desc="Keep your details up to date"
          />
          <NavCard
            to="/app/settings/notifications"
            Icon={Bell}
            title="Notifications"
            desc="Choose what you hear about"
          />
        </div>

        <Section title="Security">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-ink">Password reset</p>
              <p className="text-xs text-ink-mute">We'll send a secure link to your email.</p>
            </div>
            <button
              onClick={handleReset}
              className="rounded-full bg-violet px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Send email
            </button>
          </div>
        </Section>
      </div>
    </div>
  );
}

function NavCard({
  to,
  Icon,
  title,
  desc,
}: {
  to: LinkProps["to"];
  Icon: LucideIcon;
  title: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-3xl border border-hairline bg-surface-2 p-5 transition hover:border-violet/50 hover:bg-surface-3"
    >
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet/20 text-violet">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-sm font-bold text-ink">{title}</p>
        <p className="truncate text-xs text-ink-mute">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-ink-mute transition group-hover:translate-x-0.5 group-hover:text-ink" />
    </Link>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
      <h2 className="mb-4 font-display text-lg font-bold text-ink">{title}</h2>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-hairline py-2 text-sm last:border-0">
      <span className="text-ink-dim">{label}</span>
      <span className="font-semibold text-ink capitalize">{value}</span>
    </div>
  );
}
