import { Instagram } from "lucide-react";

/** Sends a signed-out visitor into the Instagram login flow. */
export function InstagramButton({ label = "Continue with Instagram" }: { label?: string }) {
  return (
    <a
      href="/api/public/instagram/start"
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-hairline bg-surface-2 px-6 py-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2/5"
    >
      <Instagram className="size-4" />
      {label}
    </a>
  );
}
