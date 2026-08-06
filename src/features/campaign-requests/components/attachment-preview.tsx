import { useEffect, useState } from "react";
import { FileText, Paperclip, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

function useSignedUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("campaign-attachments")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);
  return url;
}

/** Read-only preview used on detail pages. */
export function AttachmentPreview({ path }: { path: string | null }) {
  const url = useSignedUrl(path);
  const isImage = Boolean(path && /\.(png|jpe?g|webp|gif)$/i.test(path));

  if (!path) return <p className="text-sm text-ink-mute">No attachment provided.</p>;

  return (
    <div className="space-y-3">
      {isImage && url ? (
        <img
          src={url}
          alt="Campaign attachment"
          className="max-h-72 w-full rounded-2xl border border-hairline object-cover"
        />
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface-3 p-4">
          <FileText className="size-5 text-ink-mute" />
          <span className="truncate text-sm text-ink-dim">{path.split("/").pop()}</span>
        </div>
      )}
      {url ? (
        <Button asChild variant="outline" size="sm">
          <a href={url} target="_blank" rel="noreferrer">
            Open attachment
          </a>
        </Button>
      ) : null}
    </div>
  );
}

/** Upload control used inside the request form. */
export function AttachmentUpload({
  userId,
  value,
  onChange,
}: {
  userId: string;
  value?: string | undefined;
  onChange: (path: string | undefined) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    if (!ALLOWED.includes(file.type)) {
      toast.error("Attach a PNG, JPG, WEBP or PDF file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Attachment must be smaller than 10MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("campaign-attachments")
      .upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange(path);
    toast.success("Attachment uploaded.");
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface-3 px-3 py-2">
          <Paperclip className="size-4 text-ink-mute" />
          <span className="flex-1 truncate text-sm text-ink-dim">{value.split("/").pop()}</span>
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-ink-mute hover:text-ink"
            aria-label="Remove attachment"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <label className="inline-flex">
          <input
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
            <span>
              <Upload className="mr-2 size-4" />
              {uploading ? "Uploading…" : "Upload attachment"}
            </span>
          </Button>
        </label>
      )}
      <p className="text-xs text-ink-mute">PNG, JPG, WEBP or PDF, up to 10MB.</p>
    </div>
  );
}
