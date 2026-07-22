import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";

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
  const roleLabel = role === "creator" ? "Creator" : role === "brand" ? "Brand" : "Account";

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

      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: adapters/auth.ts → signUp({ name, email, password, role })
        }}
      >
        <Field label="Full name" name="name" placeholder="Ada Lovelace" required />
        <Field label="Email" name="email" type="email" placeholder="you@brand.com" required />
        <Field label="Password" name="password" type="password" placeholder="At least 8 characters" required />
        <button
          type="submit"
          className="w-full rounded-full bg-midnight px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-midnight/20 transition-colors hover:bg-violet"
        >
          Create account
        </button>
      </form>
      <p className="mt-4 text-xs leading-relaxed text-midnight/50">
        By signing up you agree to our Terms and acknowledge our Privacy Policy.
      </p>
    </AuthShell>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-midnight">{label}</span>
      <input
        {...props}
        className="w-full rounded-2xl border border-midnight/10 bg-white px-4 py-3 text-midnight placeholder:text-midnight/30 focus:border-violet focus:outline-none focus:ring-4 focus:ring-violet/10"
      />
    </label>
  );
}
