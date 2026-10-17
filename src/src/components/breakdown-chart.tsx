"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarDatum = { label: string; value: number | null; note?: string };

/** Bar chart cho breakdown rời rạc (ADR theo số phòng ngủ, revenue share theo loại...). */
export function BreakdownChart({
  data,
  kind,
  currency,
}: {
  data: BarDatum[];
  kind: "money" | "pct";
  currency: string;
}) {
  const fmt = (v: number | null) => {
    if (v === null || Number.isNaN(v)) return "—";
    if (kind === "pct") return `${(v * 100).toFixed(1)}%`;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(v);
  };
  return (
    <div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} tickMargin={6} />
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => fmt(v) ?? ""}
              width={56}
            />
            <Tooltip
              formatter={(v) => fmt(typeof v === "number" ? v : null)}
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
            />
            <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.some((d) => d.note) ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-neutral-500">
          {data
            .filter((d) => d.note)
            .map((d) => (
              <span key={d.label}>
                <span className="font-medium text-neutral-700">{d.label}</span> · {d.note}
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}
