import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Creoinfo" },
      { name: "description", content: "How Creoinfo collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — Creoinfo" },
      {
        property: "og:description",
        content: "How Creoinfo collects, uses, and protects your data.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="hero-dark min-h-screen font-geist text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link
          to="/"
          className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50 hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="mt-8 font-display text-5xl font-extrabold tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-sm text-foreground/50">
          Last updated: {new Date().toLocaleDateString()}
        </p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">What we collect</h2>
            <p>
              Account details (name, email, role), workspace and campaign data you create, messages
              sent through the platform, and connected-account metadata when you link a social
              profile.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">How we use it</h2>
            <p>
              To operate the product, power the platform, deliver notifications, and improve
              reliability. We do not sell personal data.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">Your controls</h2>
            <p>
              Export or delete your workspace at any time from Settings. Contact{" "}
              <span className="text-violet">privacy@projecteros.app</span> for data requests.
            </p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">Security</h2>
            <p>
              Data is encrypted in transit and at rest. Access is scoped by row-level security on
              every user-owned record.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
