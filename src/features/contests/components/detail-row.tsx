import type { ReactNode } from "react";

export function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="border-b border-hairline py-3 last:border-0">
      <dt className="font-mono text-[10px] uppercase tracking-widest text-ink-mute">{label}</dt>
      <dd className="mt-1 text-sm text-ink">{value}</dd>
    </div>
  );
}

export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-hairline bg-surface-2 p-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-ink">{title}</h3>
      {children}
    </div>
  );
}

const nf = new Intl.NumberFormat();

export const dash = (v: string | null | undefined) => (v && v.trim() !== "" ? v : "—");
export const numOr = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : nf.format(v);
export const money = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : `₹${nf.format(v)}`;
export const dateOr = (v: string | null | undefined) =>
  v
    ? new Date(v).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
    : "—";
