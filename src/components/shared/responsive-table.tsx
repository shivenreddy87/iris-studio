import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResponsiveColumn<T> = {
  /** Stable key for the column. */
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Shown on the collapsed mobile card (title / subtitle / trailing slots). */
  mobile?: "title" | "subtitle" | "trailing" | "hidden" | "detail";
  className?: string;
  headerClassName?: string;
};

type Props<T> = {
  rows: T[];
  columns: ResponsiveColumn<T>[];
  rowKey: (row: T) => string;
  /** Rendered above every card / to the left of every row (checkbox, avatar…). */
  leading?: (row: T) => ReactNode;
  /** Actions shown inside the expanded card and in the last table cell. */
  actions?: (row: T) => ReactNode;
  empty?: ReactNode;
  /** Minimum table width before horizontal scrolling kicks in (desktop only). */
  minWidth?: number;
  className?: string;
};

/**
 * One data set, two presentations:
 * - `md` and up: a real table (horizontal scroll only if it genuinely overflows)
 * - below `md`: stacked, expandable cards so nothing is clipped on a phone
 */
export function ResponsiveTable<T>({
  rows,
  columns,
  rowKey,
  leading,
  actions,
  empty = "Nothing here yet.",
  minWidth = 720,
  className,
}: Props<T>) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <div className="rounded-3xl border border-hairline bg-surface-2 p-8 text-center text-sm text-ink-mute">
        {empty}
      </div>
    );
  }

  const visible = columns.filter((c) => c.mobile !== "hidden");
  const title = visible.find((c) => c.mobile === "title") ?? visible[0];
  const subtitle = visible.find((c) => c.mobile === "subtitle");
  const trailing = visible.find((c) => c.mobile === "trailing");
  const details = visible.filter((c) => c !== title && c !== subtitle && c !== trailing);

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: cards */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const key = rowKey(row);
          const open = expanded === key;
          return (
            <li
              key={key}
              className="overflow-hidden rounded-2xl border border-hairline bg-surface-2"
            >
              <div className="flex items-start gap-3 p-4">
                {leading ? <div className="shrink-0 pt-0.5">{leading(row)}</div> : null}
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : key)}
                  aria-expanded={open}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink">{title?.cell(row)}</div>
                    {subtitle ? (
                      <div className="mt-1 text-xs text-ink-mute">{subtitle.cell(row)}</div>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {trailing ? <div className="text-xs">{trailing.cell(row)}</div> : null}
                    <ChevronDown
                      className={cn(
                        "size-4 text-ink-mute transition-transform",
                        open && "rotate-180",
                      )}
                    />
                  </div>
                </button>
              </div>

              {open ? (
                <div className="border-t border-hairline/60 px-4 py-3">
                  <dl className="grid grid-cols-1 gap-2 text-sm xs:grid-cols-2">
                    {details.map((col) => (
                      <div key={col.id} className="min-w-0">
                        <dt className="text-[10px] uppercase tracking-widest text-ink-mute">
                          {col.header}
                        </dt>
                        <dd className="mt-0.5 text-ink-dim">{col.cell(row)}</dd>
                      </div>
                    ))}
                  </dl>
                  {actions ? (
                    <div className="mt-3 flex flex-wrap gap-2 [&>*]:flex-1">{actions(row)}</div>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="scroll-x hidden rounded-3xl border border-hairline bg-surface-2 md:block">
        <table className="w-full text-left text-sm" style={{ minWidth }}>
          <thead className="border-b border-hairline text-[10px] uppercase tracking-widest text-ink-mute">
            <tr>
              {leading ? <th className="px-4 py-3" /> : null}
              {columns.map((col) => (
                <th key={col.id} className={cn("px-4 py-3", col.headerClassName)}>
                  {col.header}
                </th>
              ))}
              {actions ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-hairline/60 last:border-0">
                {leading ? <td className="px-4 py-3">{leading(row)}</td> : null}
                {columns.map((col) => (
                  <td key={col.id} className={cn("px-4 py-3 align-middle", col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
                {actions ? <td className="px-4 py-3 text-right">{actions(row)}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
