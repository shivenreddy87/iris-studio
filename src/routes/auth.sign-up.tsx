import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const searchSchema = z.object({
  role: z.enum(["brand", "creator"]).optional(),
});

export const Route = createFileRoute("/auth/sign-up")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Create your account — Project Eros" },
      { name: "description", content: "Create your Project Eros account and meet Iris." },
      { property: "og:title", content: "Create your account — Project Eros" },
      { property: "og:description", content: "Join Project Eros — the AI OS for influencer marketing." },
    ],
  }),
  component: SignUp,
});

function SignUp() {
  const { role } = useSearch({ from: "/auth/sign-up" });
  const navigate = useNavigate();
  const roleLabel = role === "creator" ? "Creator" : role === "brand" ? "Brand" : "Account";
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const full_name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name, role: role ?? "brand" },
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to Eros. Iris is warming up.");
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
      title={`Create your ${roleLabel} account.`}
      subtitle="Two minutes to set up. Iris will handle the rest."
      footer={
        <p className="mt-8">
          Already have an account?{" "}
          <Link to="/auth/sign-in" className="font-semibold text-violet hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      {role ? (
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet/10 bg-violet/5 px-3 py-1 font-mono text-xs uppercase tracking-widest text-violet">
          <span className="size-1.5 rounded-full bg-violet" />
          Signing up as {role}
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="Full name" name="name" placeholder="Ada Lovelace" required />
        <Field label="Email" name="email" type="email" placeholder="you@brand.com" required />
        <Field label="Password" name="password" type="password" placeholder="At least 8 characters" required />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-midnight px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-midnight/20 transition-colors hover:bg-violet disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-widest text-ink/30">
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

      <p className="mt-4 text-xs leading-relaxed text-ink-mute">
        By signing up you agree to our Terms and acknowledge our Privacy Policy.
      </p>
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
