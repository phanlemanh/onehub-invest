import type { AirdnaComparison } from "@/lib/queries";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";

const fmtVal = (v: number | null, unit: string) => {
  if (v === null) return "—";
  if (unit === "VND") return fmtMoney(v, "VND");
  if (unit === "USD") return `$${v.toFixed(1)}`;
  if (unit === "%") return v > 1 ? `${(v * 100).toFixed(1)}%` : `${v.toFixed(1)}%`;
  return fmtInt(v);
};

/** Section đối chiếu One Invest (self-collected) vs AirDNA (LTM bookings). */
export function AirdnaCompare({ data }: { data: AirdnaComparison }) {
  return (
    <div>
      {/* Market Score badge */}
      {data.marketScore ? (
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
            <span className="text-2xl font-bold text-blue-800">
              {data.marketScore.total}
            </span>
            <span className="text-xs text-blue-600">AirDNA Market Score</span>
          </div>
          <div className="flex gap-1.5">
            {[
              ["Seasonality", data.marketScore.seasonality],
              ["Rev Growth", data.marketScore.revenueGrowth],
              ["Regulation", data.marketScore.regulation],
              ["Rental Demand", data.marketScore.rentalDemand],
            ].map(([label, v]) => (
              <span key={label as string} className="rounded bg-neutral-100 px-2 py-1 text-[11px] text-neutral-600">
                {label}: <b>{v as number}</b>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {/* Comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
              <th className="py-2 pr-2 font-medium">Chỉ số</th>
              <th className="py-2 pr-2 text-right font-medium">One Invest</th>
              <th className="py-2 pr-2 text-right font-medium">AirDNA (LTM)</th>
              <th className="py-2 text-right font-medium">Tỉ lệ</th>
            </tr>
          </thead>
          <tbody>
            {data.metrics.map((m) => (
              <tr key={m.metric} className="border-b border-neutral-100 last:border-0">
                <td className="py-2 pr-2 font-medium">{m.metric}</td>
                <td className="py-2 pr-2 text-right tabular-nums">
                  {fmtVal(m.ourValue, m.ourUnit)}
                  <span className="ml-1 text-xs text-neutral-400">{m.ourUnit}</span>
                </td>
                <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                  {fmtVal(m.airdnaValue, m.airdnaUnit)}
                  <span className="ml-1 text-xs text-neutral-400">{m.airdnaUnit}</span>
                </td>
                <td className="py-2 text-right tabular-nums">
                  {m.ratio !== null ? (
                    <span className={m.ratio < 0.5 || m.ratio > 2 ? "font-semibold text-amber-600" : "text-emerald-700"}>
                      {m.ratio.toFixed(2)}×
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-2 text-[11px] text-neutral-400">
        One Invest = forward-window, giá niêm yết, Airbnb-only · AirDNA = LTM,
        booking thực, Airbnb+Vrbo · {data.submarketCount} submarkets AirDNA
        {data.capturedAt ? ` · cập nhật ${data.capturedAt.slice(0, 10)}` : ""}
      </div>
    </div>
  );
}
