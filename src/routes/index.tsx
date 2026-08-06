import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BackgroundVideo } from "@/components/hero/BackgroundVideo";
import logoUrl from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Project Eros | Influencer Campaign Platform" },
      {
        name: "description",
        content:
          "Project Eros is an influencer collaboration platform where businesses create campaigns, creators discover opportunities, administrators manage contests, and every campaign is tracked from request to payout.",
      },
      { property: "og:title", content: "Project Eros | Influencer Campaign Platform" },
      {
        property: "og:description",
        content:
          "Project Eros is an influencer collaboration platform where businesses create campaigns, creators discover opportunities, administrators manage contests, and every campaign is tracked from request to payout.",
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
                alt="Iris AI"
                height={56}
                width={190}
                style={{ height: 56, width: "auto" }}
              />
            </Link>
            <Link to="/auth/sign-in">
              <Button variant="heroSecondary" className="rounded-full px-5 py-2">
                Sign In
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
              Iris{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(to left, #6366f1, #a855f7, #fcd34d)",
                }}
              >
                AI
              </span>
            </h1>
            <p className="mt-[9px] max-w-md text-lg leading-8 text-hero-sub opacity-80">
              An embedded strategist that plans campaigns,
              <br />
              discovers creators, and negotiates deals for you.
            </p>
            <Link to="/auth/role" search={{ role: "brand" }} className="mt-[25px]">
              <Button
                variant="heroSecondary"
                className="rounded-full text-base"
                style={{ paddingLeft: 29, paddingRight: 29, paddingTop: 24, paddingBottom: 24 }}
              >
                Sign up to access
              </Button>
            </Link>
          </div>
        </div>

        <footer className="relative z-10 mt-auto flex flex-col items-center gap-3 border-t border-white/8 px-8 py-8 text-xs text-foreground/50 sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Project Eros. All rights reserved.</p>
          <nav className="flex items-center gap-6">
            <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
        </footer>
      </div>
    </section>
  );
}
