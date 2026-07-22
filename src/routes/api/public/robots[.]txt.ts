import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const body = `User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /auth/\n\nSitemap: ${origin}/sitemap.xml\n`;
        return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      },
    },
  },
});
