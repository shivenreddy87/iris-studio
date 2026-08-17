import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BackgroundVideo } from "@/components/hero/BackgroundVideo";
import logoUrl from "@/assets/creoinfo-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Creoinfo | Influencer Campaign Platform" },
      {
        name: "description",
        content:
          "Creoinfo connects Hyderabad businesses with Instagram creators through performance contests. Publish a brief, pick creators, and reward them for the views their content actually earns.",
      },
      { property: "og:title", content: "Creoinfo | Influencer Campaign Platform" },
      {
        property: "og:description",
        content:
          "Creoinfo connects Hyderabad businesses with Instagram creators through performance contests. Publish a brief, pick creators, and reward them for the views their content actually earns.",
      },
    ],
  }),

  component: LandingPage,
});

function LandingPage() {
  return (
    <section className="hero-dark relative flex min-h-screen flex-col overflow-hidden font-geist">
      <div className="absolute inset-0 z-0 overflow-hidden">
        <BackgroundVideo />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-[527px] w-[984px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-950 opacity-90 blur-[82px]"
      />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="relative">
          <nav className="flex items-center justify-between px-8 py-5">
            <Link to="/" className="flex items-center">
              <img
                src={logoUrl}
                alt="Creoinfo"
                style={{ height: 48, width: "auto" }}
              />
            </Link>
            <Link to="/auth/sign-in" aria-label="Login to Creoinfo">
              <Button variant="heroSecondary" className="rounded-full px-5 py-2">
                Login
              </Button>
            </Link>
          </nav>
          <div className="mt-[3px] h-px w-full bg-gradient-to-r from-transparent via-foreground/20 to-transparent" />
        </header>

        <div className="flex flex-1 items-center justify-center overflow-visible px-8">
          <div className="flex flex-col items-center text-center">
            <h1
              className="font-hero text-foreground"
              style={{
                fontSize: 220,
                fontWeight: 400,
                lineHeight: 1.02,
                letterSpacing: "-0.024em",
              }}
            >
              <span className="sr-only">Creoinfo</span>
              <img
                src={logoUrl}
                alt="Creoinfo logo"
                aria-hidden="true"
                className="mx-auto block w-full max-w-[560px]"
                style={{ height: "auto" }}
              />
            </h1>
            <p className="mt-[9px] max-w-md text-lg leading-8 text-hero-sub opacity-80">
              Creoinfo connects Hyderabad businesses with Instagram creators through performance
              contests. Publish a brief, choose your creators, and reward them for the views their
              content actually earns.
            </p>
            <p className="mt-3 text-xs text-foreground/50">
              Instagram-first, launching in Hyderabad • Businesses • Creators • Administrators
            </p>

            <Link
              to="/auth/role"
              search={{ role: "brand" }}
              className="mt-[25px]"
              aria-label="Get started with Creoinfo"
            >
              <Button
                variant="heroSecondary"
                className="rounded-full text-base"
                style={{ paddingLeft: 29, paddingRight: 29, paddingTop: 24, paddingBottom: 24 }}
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>

        <footer className="relative z-10 mt-auto flex flex-col items-center gap-3 border-t border-white/8 px-8 py-8 text-xs text-foreground/50 sm:flex-row sm:justify-center">
          <p>© {new Date().getFullYear()} Creoinfo. All rights reserved.</p>
        </footer>
      </div>
    </section>
  );
}
