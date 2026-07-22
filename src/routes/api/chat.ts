import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: UIMessage[]; system?: string };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Authenticated Supabase client for tool execution
        const authHeader = request.headers.get("authorization") ?? undefined;
        const supabaseUrl = process.env.SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY!;
        const sb = createClient<Database>(supabaseUrl, supabaseKey, {
          auth: { persistSession: false },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (supabaseKey.startsWith("sb_") && h.get("Authorization") === `Bearer ${supabaseKey}`) {
                h.delete("Authorization");
              }
              h.set("apikey", supabaseKey);
              if (authHeader && !h.has("Authorization")) h.set("Authorization", authHeader);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const system =
          body.system ??
          `You are Iris — an embedded AI strategist for Project Eros, an influencer marketing platform.
You help brands plan campaigns, discover the right creators, negotiate deals, and analyze performance.
You help creators grow their media kit, evaluate opportunities, and negotiate with brands.

You have tools that let you search the real creator database. Use searchCreators whenever the user asks
about finding, comparing, or recommending creators. Cite specific creators by name and handle when you have data.

Be concise, warm, and actionable. Use markdown. Keep responses under 250 words unless asked for depth.`;

        const gateway = createLovableAiGateway(key);
        const model = gateway("openai/gpt-5.5");

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(body.messages),
            stopWhen: stepCountIs(6),
            tools: {
              searchCreators: tool({
                description:
                  "Search the creator database by keyword (name, handle, niche, location, or bio). Returns up to 8 matching creators with follower counts, engagement rate, avg rate, and match score.",
                inputSchema: z.object({
                  query: z.string().describe("Free-text search terms — niche, location, name, or vibe."),
                }),
                execute: async ({ query }) => {
                  const q = query.trim();
                  let builder = sb.from("creator_profiles").select(
                    "user_id, display_name, handle, niche, location, followers, engagement_rate, avg_rate, tags, match_score",
                  ).limit(8);
                  if (q) {
                    builder = builder.or(
                      `display_name.ilike.%${q}%,handle.ilike.%${q}%,niche.ilike.%${q}%,location.ilike.%${q}%,bio.ilike.%${q}%`,
                    );
                  }
                  const { data, error } = await builder.order("match_score", { ascending: false });
                  if (error) return { error: error.message, results: [] };
                  return { results: data ?? [] };
                },
              }),
            },
          });
          return result.toUIMessageStreamResponse({
            originalMessages: body.messages,
          });
        } catch (err) {
          console.error("Iris chat error", err);
          return new Response("Iris is unavailable right now.", { status: 500 });
        }
      },
    },
  },
});
