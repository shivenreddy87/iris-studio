import { createFileRoute } from "@tanstack/react-router";

const PUBLIC_PATHS = ["/", "/pricing", "/privacy", "/terms", "/auth/sign-in", "/auth/sign-up"];

export const Route = createFileRoute("/api/public/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = new URL(request.url).origin;
        const today = new Date().toISOString().slice(0, 10);
        const urls = PUBLIC_PATHS.map(
          (p) =>
            `  <url><loc>${origin}${p}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq></url>`,
        ).join("\n");
        const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
