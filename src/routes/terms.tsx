import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Project Eros" },
      { name: "description", content: "The terms governing your use of Project Eros." },
      { property: "og:title", content: "Terms of Service — Project Eros" },
      { property: "og:description", content: "The terms governing your use of Project Eros." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="hero-dark min-h-screen font-geist text-foreground">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <Link to="/" className="font-mono text-xs uppercase tracking-[0.2em] text-foreground/50 hover:text-foreground">
          ← Back
        </Link>
        <h1 className="mt-8 font-display text-5xl font-extrabold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-foreground/50">Last updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-foreground/80">
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">Acceptable use</h2>
            <p>Don't post unlawful, harassing, or infringing content. Don't misrepresent identities or scrape the platform.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">Your content</h2>
            <p>You retain ownership of the content you upload. You grant Project Eros a license to host, display, and process it to operate the service.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">Service availability</h2>
            <p>We aim for high uptime but the service is provided "as is" without warranties. Notice of scheduled maintenance will be posted where reasonably possible.</p>
          </section>
          <section>
            <h2 className="font-display text-2xl font-bold text-foreground">Termination</h2>
            <p>You may close your account at any time. We may suspend accounts that violate these terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
