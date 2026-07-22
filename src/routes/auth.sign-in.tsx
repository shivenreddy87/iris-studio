import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/auth-shell";

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
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          // TODO: adapters/auth.ts → signIn(email, password)
        }}
      >
        <Field label="Email" type="email" name="email" placeholder="you@brand.com" required />
        <Field label="Password" type="password" name="password" placeholder="••••••••" required />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-midnight/60">
            <input type="checkbox" className="rounded border-midnight/20" />
            Remember me
          </label>
          <a href="#" className="font-semibold text-violet hover:underline">
            Forgot password?
          </a>
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-midnight px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-midnight/20 transition-colors hover:bg-violet"
        >
          Sign in
        </button>
      </form>

      <div className="my-8 flex items-center gap-3 text-xs uppercase tracking-widest text-midnight/30">
        <div className="h-px flex-1 bg-midnight/10" />
        or
        <div className="h-px flex-1 bg-midnight/10" />
      </div>

      <button className="w-full rounded-full border border-midnight/10 bg-white px-6 py-3.5 text-sm font-semibold text-midnight transition-colors hover:bg-midnight/5">
        Continue with Google
      </button>
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
