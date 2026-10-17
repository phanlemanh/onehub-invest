import Link from "next/link";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";
import type { TopSubmarket } from "@/lib/queries";

/** Bảng xếp hạng submarket (mirror "Top Submarkets" của AirDNA). */
export function TopSubmarkets({
  rows,
  currency,
  basePath,
}: {
  rows: TopSubmarket[];
  currency: string;
  basePath: string; // vd "/th/bangkok"
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-2 pr-2 font-medium">#</th>
            <th className="py-2 pr-2 font-medium">Submarket</th>
            <th className="py-2 pr-2 text-right font-medium">Listings</th>
            <th className="py-2 pr-2 text-right font-medium">ADR</th>
            <th className="py-2 pr-2 text-right font-medium">Occupancy</th>
            <th className="py-2 pr-2 text-right font-medium">RevPAR</th>
            <th className="py-2 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-neutral-100 last:border-0">
              <td className="py-2 pr-2 text-neutral-400">{i + 1}</td>
              <td className="py-2 pr-2">
                <Link
                  href={`${basePath}/${r.slug}`}
                  className="font-medium text-blue-700 hover:underline"
                >
                  {r.name}
                </Link>
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {fmtInt(r.listings)}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {fmtMoney(r.adr, currency)}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {fmtPct(r.occupancy)}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {fmtMoney(r.revpar, currency)}
              </td>
              <td className="py-2 text-right font-medium tabular-nums">
                {fmtMoney(r.revenue, currency, true)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
