import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Project Eros" },
      { name: "description", content: "Account settings." },
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
    <div className="mx-auto max-w-3xl px-4 py-10 lg:px-8">
      <div className="mb-8">
        <p className="mb-1 font-mono text-xs uppercase tracking-widest text-muted">Settings</p>
        <h1 className="font-display text-4xl font-extrabold text-primary">Your account</h1>
      </div>
      <div className="space-y-6">
        <Section title="Profile">
          <Row label="Name" value={user?.user_metadata?.full_name ?? "—"} />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Role" value={role ?? "—"} />
        </Section>
        <Section title="Security">
          <button
            onClick={handleReset}
            className="rounded-full bg-midnight px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet"
          >
            Send password reset email
          </button>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6 shadow-sm">
      <h2 className="mb-4 font-display text-lg font-bold text-primary">{title}</h2>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-hairline py-2 text-sm last:border-0">
      <span className="text-secondary">{label}</span>
      <span className="font-semibold text-primary capitalize">{value}</span>
    </div>
  );
}
