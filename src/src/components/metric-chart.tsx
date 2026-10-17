"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Point = { label: string; value: number | null };

export function MetricChart({
  title,
  subtitle,
  points,
  kind,
}: {
  title: string;
  subtitle?: string;
  points: Point[];
  kind: "money" | "pct";
}) {
  const fmt = (v: number | null) =>
    v === null
      ? "—"
      : kind === "pct"
        ? `${(v * 100).toFixed(1)}%`
        : new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v);
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-sm font-semibold text-neutral-900">{title}</div>
      {subtitle ? <div className="text-xs text-neutral-500">{subtitle}</div> : null}
      <div className="mt-3 h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={6} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => fmt(v) ?? ""}
              width={48}
            />
            <Tooltip
              formatter={(v) => fmt(typeof v === "number" ? v : null)}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
