import Link from "next/link";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";
import type { YieldRow } from "@/lib/queries";

/** Yield theo quận: giá bán/m² | thuê LT | STR revenue | yield STR% | yield LT% */
export function YieldCard({ rows, currency }: { rows: YieldRow[]; currency: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-2 pr-2 font-medium">Phường/Quận</th>
            <th className="py-2 pr-2 text-right font-medium">Giá/m²</th>
            <th className="py-2 pr-2 text-right font-medium">Thuê LT/th</th>
            <th className="py-2 pr-2 text-right font-medium">STR/th</th>
            <th className="py-2 pr-2 text-right font-medium">Yield STR</th>
            <th className="py-2 text-right font-medium">Yield LT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.areaId} className="border-b border-neutral-100 last:border-0">
              <td className="py-2 pr-2">
                <Link
                  href={`/vn/hanoi/${r.slug}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {r.name}
                </Link>
                <span className="ml-1 text-xs text-neutral-400">
                  ({fmtInt(r.nSale)} bán, {fmtInt(r.nRentLt)} thuê)
                </span>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {r.medianPerm2 ? `${fmtMoney(r.medianPerm2, currency, true)}/m²` : "—"}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {r.medianRentLt ? fmtMoney(r.medianRentLt, currency) : "—"}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {r.strRevenueMonth ? fmtMoney(r.strRevenueMonth, currency) : "—"}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums">
                {r.yieldStr !== null ? (
                  <span className={r.yieldStr > 0.08 ? "font-semibold text-emerald-700" : "text-neutral-600"}>
                    {fmtPct(r.yieldStr)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2 text-right tabular-nums">
                {r.yieldLt !== null ? (
                  <span className={r.yieldLt > 0.06 ? "font-semibold text-emerald-700" : "text-neutral-600"}>
                    {fmtPct(r.yieldLt)}
                  </span>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 text-[11px] text-neutral-400">
        Yield tính trên giả định căn hộ 60m²; STR = tháng có ADR mới nhất; nguồn tin:{" "}
        <span className="font-semibold text-amber-600">SIMULATED (mock data)</span>
      </div>
    </div>
  );
}
