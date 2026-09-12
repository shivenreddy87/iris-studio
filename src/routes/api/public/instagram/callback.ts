/**
 * Instagram OAuth return address. Registered in the Meta app as
 * `<origin>/api/public/instagram/callback`.
 *
 * Read-only: the code is exchanged for a token that is used solely to read
 * profile and media metrics. Nothing is ever posted on the user's behalf.
 */
import { createFileRoute } from "@tanstack/react-router";

function redirect(to: string): Response {
  return new Response(null, { status: 302, headers: { Location: to } });
}

export const Route = createFileRoute("/api/public/instagram/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const origin = url.origin;
        const code = url.searchParams.get("code");
        const stateValue = url.searchParams.get("state");
        const denied = url.searchParams.get("error_description") ?? url.searchParams.get("error");

        const { verifyState } = await import(
          "@/features/social-verification/instagram/crypto.server"
        );
        const state = stateValue ? await verifyState(stateValue) : null;
        const failTo = (message: string) =>
          redirect(
            state?.mode === "connect"
              ? `${origin}/app/settings/social?instagram_error=${encodeURIComponent(message)}`
              : `${origin}/auth/sign-in?instagram_error=${encodeURIComponent(message)}`,
          );

        if (denied) return failTo(denied);
        if (!state) return failTo("That Instagram link expired. Please try again.");
        if (!code) return failTo("Instagram did not return an authorization code.");

        try {
          const { exchangeCodeForTokens, fetchInstagramProfile } = await import(
            "@/features/social-verification/instagram/api.server"
          );
          const tokens = await exchangeCodeForTokens(code, origin);
          const profile = await fetchInstagramProfile(tokens.accessToken);
          if (!profile.username) throw new Error("Instagram did not return a profile.");

          const { saveInstagramConnection, resolveUserForInstagramLogin, findUserByInstagramId, createSessionLink } =
            await import("@/features/social-verification/instagram/link.server");

          if (state.mode === "connect" && state.userId) {
            await saveInstagramConnection({ userId: state.userId, profile, tokens });
            return redirect(`${origin}/app/settings/social?instagram=connected`);
          }

          const existing = await findUserByInstagramId(profile.providerUserId);
          const userId = existing ?? (await resolveUserForInstagramLogin(profile));
          await saveInstagramConnection({ userId, profile, tokens });
          const tokenHash = await createSessionLink(userId, origin);
          const target = new URL(`${origin}/auth/instagram`);
          target.searchParams.set("token_hash", tokenHash);
          if (!existing) target.searchParams.set("new", "1");
          return redirect(target.toString());
        } catch (error) {
          return failTo(error instanceof Error ? error.message : "Instagram sign-in failed.");
        }
      },
    },
  },
});
