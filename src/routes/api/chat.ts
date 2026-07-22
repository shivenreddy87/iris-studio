import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
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

        const system =
          body.system ??
          `You are Iris — an embedded AI strategist for Project Eros, an influencer marketing platform.
You help brands plan campaigns, discover the right creators, negotiate deals, and analyze performance.
You help creators grow their media kit, evaluate opportunities, and negotiate with brands.
Be concise, warm, and actionable. Use markdown. Keep responses under 200 words unless asked for depth.`;

        const gateway = createLovableAiGateway(key);
        const model = gateway("openai/gpt-5.5");

        try {
          const result = streamText({
            model,
            system,
            messages: await convertToModelMessages(body.messages),
          });
          return result.toUIMessageStreamResponse();
        } catch (err) {
          console.error("Iris chat error", err);
          return new Response("Iris is unavailable right now.", { status: 500 });
        }
      },
    },
  },
});
