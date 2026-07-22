import { createFileRoute } from "@tanstack/react-router";
import { Route as MessagesRoute } from "./app.messages";

// Reuse the messages page component for the creator inbox.
const MessagesComponent = MessagesRoute.options.component!;

export const Route = createFileRoute("/app/creator/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Project Eros" },
      { name: "description", content: "Your creator inbox." },
    ],
  }),
  component: MessagesComponent,
});
