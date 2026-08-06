import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadCsv } from "../chart.helpers";

/**
 * Placeholder export: generates a CSV from whatever rows the caller supplies
 * (usually a report payload returned by a server function).
 */
export function ExportButton({
  filename,
  label = "Export",
  rows,
  load,
  variant = "outline",
}: {
  filename: string;
  label?: string;
  rows?: Record<string, unknown>[];
  load?: () => Promise<Record<string, unknown>[]>;
  variant?: "default" | "outline" | "ghost" | "secondary";
}) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    setBusy(true);
    try {
      const data = load ? await load() : (rows ?? []);
      downloadCsv(filename, data);
      toast.success(`${label} downloaded`, {
        description: `${data.length} row${data.length === 1 ? "" : "s"} exported.`,
      });
    } catch (error) {
      toast.error("Export failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button type="button" variant={variant} size="sm" onClick={handleClick} disabled={busy}>
      {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      {label}
    </Button>
  );
}
