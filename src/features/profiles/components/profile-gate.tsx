import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/ui/list-skeleton";
import { profileCompletion } from "../completion";
import { getMyProfile } from "../profiles.functions";

/** Feature areas that stay locked until the profile reaches 100%. */
export const GATED_PATHS = ["/app/business/requests", "/app/contests", "/app/entries"];

export function isGatedPath(path: string) {
  return GATED_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/** Shared read of the signed-in user's profile; same key as dashboard + profile page. */
export function useProfileGate() {
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile(),
  });
  const completion = profileCompletion(profile);
  const isAdmin = profile?.role === "admin";
  return {
    isLoading,
    completion,
    unlocked: isLoading || isAdmin || completion.percent >= 100,
  };
}

export function ProfileGate({ children }: { children: ReactNode }) {
  const { isLoading, completion, unlocked } = useProfileGate();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
        <ListSkeleton rows={3} />
      </div>
    );
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8 lg:px-8 lg:py-10">
      <div className="rounded-3xl border border-hairline bg-surface-2 p-8 text-center">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-violet/10 text-violet">
          <Lock className="size-5" />
        </div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Complete your profile to unlock this section
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-dim">
          Your profile is {completion.percent}% complete.
          {completion.missing.length > 0 ? ` Still missing: ${completion.missing.join(", ")}.` : ""}
        </p>
        <Button asChild className="mt-6">
          <Link to="/app/profile">Complete profile</Link>
        </Button>
      </div>
    </div>
  );
}
