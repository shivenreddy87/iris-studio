import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS, CHART_COLORS, CHART_GRID, CHART_TOOLTIP_STYLE } from "../chart.helpers";
import type { SeriesPoint } from "../types";

export type ChartKind = "line" | "area" | "bar" | "pie" | "funnel";

/**
 * Single chart primitive used by every analytics surface, so tokens, tooltips
 * and empty states stay consistent.
 */
export function AnalyticsChart({
  kind,
  data,
  height = 260,
  color = CHART_COLORS[0],
  valueLabel = "Value",
  emptyHint = "No data yet.",
}: {
  kind: ChartKind;
  data: SeriesPoint[];
  height?: number;
  color?: string;
  valueLabel?: string;
  emptyHint?: string;
}) {
  const hasData = data.some((d) => d.value > 0);
  if (!data.length || !hasData) {
    return (
      <div
        className="grid place-items-center rounded-2xl border border-dashed border-hairline text-sm text-ink-mute"
        style={{ height }}
      >
        {emptyHint}
      </div>
    );
  }

  if (kind === "funnel") {
    const max = Math.max(...data.map((d) => d.value), 1);
    return (
      <ul className="space-y-3">
        {data.map((step, i) => (
          <li key={step.label}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-ink-dim">{step.label}</span>
              <span className="font-mono text-ink">{step.value.toLocaleString()}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(step.value / max) * 100}%`,
                  background: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {kind === "pie" ? (
          <PieChart>
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={50} outerRadius={90}>
              {data.map((entry, i) => (
                <Cell key={entry.label} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : kind === "bar" ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={11} />
            <YAxis stroke={CHART_AXIS} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Bar dataKey="value" name={valueLabel} fill={color} radius={[6, 6, 0, 0]} />
          </BarChart>
        ) : kind === "area" ? (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={11} minTickGap={24} />
            <YAxis stroke={CHART_AXIS} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="value"
              name={valueLabel}
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
            <XAxis dataKey="label" stroke={CHART_AXIS} fontSize={11} minTickGap={24} />
            <YAxis stroke={CHART_AXIS} fontSize={11} allowDecimals={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Line
              type="monotone"
              dataKey="value"
              name={valueLabel}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
