import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BUCKET_RULES, uploadToBucket, useSignedUrl } from "@/lib/storage";

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
  const preview = useSignedUrl("avatars", value ?? null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setUploading(true);
    const result = await uploadToBucket("avatars", file, userId);
    setUploading(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onChange(result.path);
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
