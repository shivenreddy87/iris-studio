import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Uploads a logo / profile photo into the private `avatars` bucket under the
 * user's own folder and hands back the stored path. Display uses a signed URL.
 */
export function AvatarUpload({
  userId,
  value,
  onChange,
  label,
  rounded = "full",
}: {
  userId: string;
  value?: string | undefined;
  onChange: (path: string | undefined) => void;
  label: string;
  rounded?: "full" | "xl";
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!value) {
      setPreview(null);
      return;
    }
    supabase.storage
      .from("avatars")
      .createSignedUrl(value, 60 * 60)
      .then(({ data }) => {
        if (!cancelled) setPreview(data?.signedUrl ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [value]);

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange(path);
  }

  return (
    <div className="flex items-center gap-4">
      <div
        className={`grid size-20 shrink-0 place-items-center overflow-hidden border border-hairline bg-surface-3 ${
          rounded === "full" ? "rounded-full" : "rounded-2xl"
        }`}
      >
        {preview ? (
          <img src={preview} alt={label} className="size-full object-cover" />
        ) : (
          <Upload className="size-5 text-ink-mute" />
        )}
      </div>
      <div className="space-y-2">
        <label className="inline-flex">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
          <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
            <span>{uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}</span>
          </Button>
        </label>
        <p className="text-xs text-ink-mute">PNG or JPG, up to 5MB.</p>
      </div>
    </div>
  );
}
