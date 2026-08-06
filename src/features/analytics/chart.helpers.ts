/**
 * Chart formatting helpers shared by every analytics surface.
 * Colours come from the existing design tokens, not ad-hoc hex values.
 */

export const CHART_COLORS = ["#7657FF", "#F0647D", "#4ADE80", "#FBBF24", "#38BDF8", "#A78BFA"];

export const CHART_GRID = "rgba(255,255,255,0.08)";
export const CHART_AXIS = "rgba(255,255,255,0.5)";

export const CHART_TOOLTIP_STYLE = {
  background: "hsl(260 50% 9%)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
} as const;

export function formatCurrency(value: number | null | undefined): string {
  const amount = value ?? 0;
  if (Math.abs(amount) >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (Math.abs(amount) >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function formatNumber(value: number | null | undefined): string {
  return (value ?? 0).toLocaleString();
}

export function formatPercent(value: number | null | undefined): string {
  return `${(value ?? 0).toFixed(1)}%`;
}

export function formatHours(value: number | null | undefined): string {
  const hours = value ?? 0;
  if (hours === 0) return "—";
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}

export function formatDays(value: number | null | undefined): string {
  const days = value ?? 0;
  return days === 0 ? "—" : `${days.toFixed(1)}d`;
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Convert any row set into a CSV string for the placeholder export flow. */
export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  return [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
  ].join("\n");
}

/** Trigger a browser download for generated report content. */
export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv || "No data available"], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
