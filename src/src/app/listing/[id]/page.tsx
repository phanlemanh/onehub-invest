export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getListingDetail } from "@/lib/queries";
import { fmtInt, fmtMoney, fmtPct } from "@/lib/format";
import { currencyFor } from "@/lib/queries";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingDetail(decodeURIComponent(id));
  if (!listing) notFound();

  const areaLink = listing.areaId && listing.marketPath
    ? `${listing.marketPath}/${listing.areaId.split("-").slice(2).join("-")}`
    : null;

  // calendar heatmap: nhóm theo tháng, mỗi ô 1 đêm
  const byMonth = new Map<string, { night: string; available: boolean | null }[]>();
  for (const c of listing.calendar) {
    const m = c.night.slice(0, 7);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(c);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        <Link href={listing.marketPath ?? "/"} className="hover:underline">
          Market
        </Link>
        {areaLink ? (
          <>
            {" › "}
            <Link href={areaLink} className="hover:underline">
              {listing.areaName}
            </Link>
          </>
        ) : null}
        {" › Listing"}
      </div>
      <h1 className="mt-1 text-2xl font-bold text-neutral-900">
        {listing.name ?? listing.id}
      </h1>
      <div className="mt-1 text-sm text-neutral-500">
        {listing.roomType ?? "—"}
        {listing.bedrooms !== null ? ` · ${listing.bedrooms === 0 ? "Studio" : `${listing.bedrooms} BR`}` : ""}
        {listing.accommodates ? ` · ${listing.accommodates} guests` : ""} ·{" "}
        {listing.areaName ?? "chưa định vị"}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Giá niêm yết</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">
            {fmtMoney(listing.priceListed, listing.currency)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Đêm đã đặt</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">
            {fmtInt(listing.stats.booked)}
            <span className="text-sm font-normal text-neutral-400"> / {fmtInt(listing.stats.nights)}</span>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Occupancy</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">
            {fmtPct(listing.stats.occupancy)}
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-neutral-500">Est. revenue</div>
          <div className="mt-1 text-2xl font-semibold text-neutral-900">
            {fmtMoney(listing.stats.revenue, listing.currency, true)}
          </div>
          <div className="text-[11px] text-neutral-400">forward window, listed-price basis</div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="text-sm font-semibold text-neutral-900">Calendar 12 tháng</div>
        <div className="text-xs text-neutral-500">
          Xanh = còn trống · Đỏ = đã đặt/khóa · chiếm chuột để xem ngày
        </div>
        <div className="mt-3 space-y-2">
          {[...byMonth.entries()].map(([month, days]) => (
            <div key={month} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-xs text-neutral-500">{month}</span>
              <div className="flex gap-[2px]">
                {days.map((d) => (
                  <span
                    key={d.night}
                    title={`${d.night}: ${d.available === null ? "?" : d.available ? "trống" : "đã đặt"}`}
                    className={`h-4 w-4 rounded-[3px] ${
                      d.available === null
                        ? "bg-neutral-200"
                        : d.available
                          ? "bg-emerald-200"
                          : "bg-red-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
