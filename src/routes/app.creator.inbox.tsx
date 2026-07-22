import { createFileRoute } from "@tanstack/react-router";
export { MessagesPage as component } from "./app.messages";
import { MessagesPage } from "./app.messages";

export const Route = createFileRoute("/app/creator/inbox")({
  head: () => ({
    meta: [
      { title: "Inbox — Project Eros" },
      { name: "description", content: "Your creator inbox." },
    ],
  }),
  component: MessagesPage,
});
