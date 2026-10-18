import Link from "next/link";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";
import type { TopSubmarket } from "@/lib/queries";

const SORTS = [
  { key: "revenue", label: "Revenue" },
  { key: "adr", label: "ADR" },
  { key: "occupancy", label: "Occupancy" },
  { key: "revpar", label: "RevPAR" },
] as const;

/** Bảng xếp hạng submarket (mirror "Top Submarkets" của AirDNA) + sort theo metric. */
export function TopSubmarkets({
  rows,
  currency,
  basePath,
  sortBy,
}: {
  rows: TopSubmarket[];
  currency: string;
  basePath: string; // vd "/th/bangkok"
  sortBy: "revenue" | "adr" | "occupancy" | "revpar";
}) {
  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {SORTS.map((s) => (
          <Link
            key={s.key}
            href={`${basePath}?sort=${s.key}`}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              sortBy === s.key
                ? "bg-blue-700 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>
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
