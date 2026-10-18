import Link from "next/link";
import { fmtMoney, fmtPct } from "@/lib/format";
import type { TopListingRow } from "@/lib/queries";

/** Top listing theo estimated revenue cửa sổ 12 tháng (mirror "Top Listings"). */
export function TopListings({
  rows,
  currency,
}: {
  rows: TopListingRow[];
  currency: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-xs uppercase tracking-wide text-neutral-500">
            <th className="py-2 pr-2 font-medium">#</th>
            <th className="py-2 pr-2 font-medium">Listing</th>
            <th className="py-2 pr-2 font-medium">Type</th>
            <th className="py-2 pr-2 text-right font-medium">ADR</th>
            <th className="py-2 pr-2 text-right font-medium">Occupancy</th>
            <th className="py-2 text-right font-medium">Est. revenue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-neutral-100 last:border-0">
              <td className="py-2 pr-2 text-neutral-400">{i + 1}</td>
              <td className="max-w-[22rem] truncate py-2 pr-2 font-medium text-neutral-800">
                <Link href={`/listing/${encodeURIComponent(r.id)}`} className="hover:text-blue-700 hover:underline">
                  {r.name ?? "—"}
                </Link>
              </td>
              <td className="py-2 pr-2 text-neutral-600">
                {r.bedrooms === null
                  ? r.roomType ?? "—"
                  : `${r.bedrooms === 0 ? "Studio" : `${r.bedrooms} BR`} · ${r.roomType ?? "—"}`}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {fmtMoney(r.adr, currency)}
              </td>
              <td className="py-2 pr-2 text-right tabular-nums text-neutral-600">
                {fmtPct(r.occupancy)}
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
