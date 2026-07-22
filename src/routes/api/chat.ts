import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";
import { createLovableAiGateway } from "@/lib/ai-gateway.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as {
          messages?: UIMessage[];
          system?: string;
          threadId?: string;
        };
        if (!Array.isArray(body.messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // ---- Optional thread persistence -------------------------------------
        // If a threadId is provided AND the caller is authenticated, persist the
        // conversation. Auth header is attached client-side by the Supabase
        // bearer middleware; we verify ownership before writing.
        let ownedThreadId: string | null = null;
        let userId: string | null = null;
        const authHeader = request.headers.get("Authorization");
        if (body.threadId && authHeader?.startsWith("Bearer ")) {
          const token = authHeader.slice("Bearer ".length);
          const { data: userRes } = await supabaseAdmin.auth.getUser(token);
          if (userRes.user) {
            const { data: t } = await supabaseAdmin
              .from("iris_threads")
              .select("id")
              .eq("id", body.threadId)
              .eq("user_id", userRes.user.id)
              .maybeSingle();
            if (t) {
              ownedThreadId = t.id;
              userId = userRes.user.id;
            }
          }
        }

        // Save the newest user message immediately (so refresh during streaming
        // preserves user input even if the assistant response is lost).
        if (ownedThreadId) {
          const last = body.messages[body.messages.length - 1];
          if (last?.role === "user") {
            await supabaseAdmin.from("iris_messages").insert({
              thread_id: ownedThreadId,
              role: "user",
              parts: last.parts as unknown as object,
            });
            // Auto-title from first user message.
            const text = last.parts
              .map((p) => (p.type === "text" ? p.text : ""))
              .join(" ")
              .trim();
            if (text) {
              await supabaseAdmin
                .from("iris_threads")
                .update({
                  updated_at: new Date().toISOString(),
                  // Only update title if it's still the default.
                  ...(body.messages.filter((m) => m.role === "user").length === 1
                    ? { title: text.slice(0, 80) }
                    : {}),
                })
                .eq("id", ownedThreadId)
                .eq("user_id", userId!);
            }
          }
        }

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
                  let builder = supabaseAdmin
                    .from("creator_profiles")
                    .select(
                      "user_id, display_name, handle, niche, location, followers, engagement_rate, avg_rate, tags, match_score",
                    )
                    .limit(8);
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
            onFinish: async ({ messages }) => {
              if (!ownedThreadId) return;
              const last = messages[messages.length - 1];
              if (last?.role !== "assistant") return;
              await supabaseAdmin.from("iris_messages").insert({
                thread_id: ownedThreadId,
                role: "assistant",
                parts: last.parts as unknown as object,
              });
              await supabaseAdmin
                .from("iris_threads")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", ownedThreadId);
            },
          });
        } catch (err) {
          console.error("Iris chat error", err);
          return new Response("Iris is unavailable right now.", { status: 500 });
        }
      },
    },
  },
});
