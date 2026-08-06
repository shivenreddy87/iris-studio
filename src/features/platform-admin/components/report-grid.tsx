import { FileSpreadsheet } from "lucide-react";
import { AnalyticsCard } from "@/features/analytics/components/analytics-card";
import { ExportButton } from "@/features/analytics/components/export-button";
import type { ReportKind } from "../types";

export type ReportDefinition = {
  kind: ReportKind;
  title: string;
  description: string;
};

export function ReportGrid({
  reports,
  generate,
}: {
  reports: ReportDefinition[];
  generate: (kind: ReportKind) => Promise<Record<string, unknown>[]>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {reports.map((report) => (
        <article
          key={report.kind}
          className="flex flex-col justify-between rounded-3xl border border-hairline bg-surface-2 p-5"
        >
          <div>
            <span className="grid size-10 place-items-center rounded-2xl bg-violet/15 text-violet">
              <FileSpreadsheet className="size-5" />
            </span>
            <h3 className="mt-4 font-display text-base font-semibold text-ink">{report.title}</h3>
            <p className="mt-1 text-sm text-ink-dim">{report.description}</p>
          </div>
          <div className="mt-5">
            <ExportButton
              filename={`${report.kind}-report`}
              label="Download CSV"
              load={() => generate(report.kind)}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

export { AnalyticsCard };
