import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — Project Eros" },
      { name: "description", content: "Sign in to Project Eros to plan campaigns with Iris." },
      { property: "og:title", content: "Sign in — Project Eros" },
      { property: "og:description", content: "Sign in to your Project Eros account." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/app" });
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message ?? "Google sign-in failed.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/app" });
  }

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Sign in to continue orchestrating with Iris."
      footer={
        <p className="mt-8">
          New here?{" "}
          <Link to="/auth/role" className="font-semibold text-violet hover:underline">
            Create an account
          </Link>
        </p>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="Email" type="email" name="email" placeholder="you@brand.com" required />
        <Field label="Password" type="password" name="password" placeholder="••••••••" required />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-midnight px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-midnight/20 transition-colors hover:bg-violet disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-widest text-ink/30">
        <div className="h-px flex-1 bg-surface-2/10" />
        or
        <div className="h-px flex-1 bg-surface-2/10" />
      </div>

      <button
        type="button"
        onClick={handleGoogle}
        className="w-full rounded-full border border-hairline bg-surface-2 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2/5"
      >
        Continue with Google
      </button>
    </AuthShell>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-hairline bg-surface-2 px-4 py-3 text-ink placeholder:text-ink/30 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/30"
      />
    </label>
  );
}
