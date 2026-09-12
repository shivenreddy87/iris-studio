/**
 * Starts "Continue with Instagram" for signed-out people. Linking an account
 * for a signed-in user goes through the authenticated server function instead.
 */
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/instagram/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const { readInstagramCredentials, instagramRedirectUri, IG_AUTHORIZE, IG_SCOPES } =
          await import("@/features/social-verification/instagram/config.server");
        const creds = readInstagramCredentials();
        if (!creds) {
          return Response.redirect(
            `${origin}/auth/sign-in?instagram_error=${encodeURIComponent("Instagram sign-in isn't set up yet.")}`,
            302,
          );
        }

        const { signState } = await import("@/features/social-verification/instagram/crypto.server");
        const state = await signState({
          mode: "login",
          userId: null,
          origin,
          issuedAt: Date.now(),
        });

        const url = new URL(IG_AUTHORIZE);
        url.searchParams.set("client_id", creds.appId);
        url.searchParams.set("redirect_uri", instagramRedirectUri(origin));
        url.searchParams.set("response_type", "code");
        url.searchParams.set("scope", IG_SCOPES.join(","));
        url.searchParams.set("state", state);
        return Response.redirect(url.toString(), 302);
      },
    },
  },
});
