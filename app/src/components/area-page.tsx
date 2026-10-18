import Link from "next/link";
import { notFound } from "next/navigation";
import {
  currencyFor,
  getArea,
  getAreaBreakdown,
  getKpis,
  getMarketGeoJson,
  getMetrics,
  getSiblingBenchmark,
  getSupplyHistory,
  getTopSubmarkets,
  getYieldRows,
  getAirdnaComparison,
} from "@/lib/queries";
import { getSessionUser, isSaved } from "@/lib/auth";
import { toggleSaved } from "@/app/actions";
import { fmtInt, fmtMoney, fmtMonth, fmtPct } from "@/lib/format";
import { KpiStrip } from "@/components/kpi-strip";
import { MetricChart } from "@/components/metric-chart";
import { BenchmarkBar } from "@/components/benchmark-bar";
import { MiniMap } from "@/components/mini-map";
import { Section } from "@/components/section";
import { BreakdownChart } from "@/components/breakdown-chart";
import { TopSubmarkets } from "@/components/top-submarkets";
import { TopListings } from "@/components/top-listings";
import { AuthBar } from "@/components/auth-bar";
import { YieldCard } from "@/components/yield-card";
import { AirdnaCompare } from "@/components/airdna-compare";

export async function AreaPage({
  areaId,
  sortBy = "revenue",
}: {
  areaId: string;
  sortBy?: "revenue" | "adr" | "occupancy" | "revpar";
}) {
  const area = await getArea(areaId);
  if (!area) notFound();

  const [metrics, kpis, benchmark, geo, breakdown, topSubs, user, supply] = await Promise.all([
    getMetrics(areaId),
    getKpis(areaId),
    area.regionType === "submarket" ? getSiblingBenchmark(areaId) : Promise.resolve(null),
    getMarketGeoJson(area.parentId ?? areaId, areaId),
    getAreaBreakdown(areaId),
    area.regionType === "market" ? getTopSubmarkets(areaId, 10, sortBy) : Promise.resolve(null),
    getSessionUser(),
    area.regionType === "market" ? getSupplyHistory(areaId) : Promise.resolve(null),
  ]);
  const yieldRows = area.regionType === "market" ? await getYieldRows(areaId) : [];
  const airdna = area.regionType === "market" ? await getAirdnaComparison(areaId) : null;
  const saved = user ? await isSaved(user.id, areaId) : false;

  const currency = currencyFor(areaId);
  const points = metrics.map((m) => ({ label: fmtMonth(m.month), ...m }));
  const [cc, ...rest] = area.id.split("-");
  const basePath = `/${cc}/${rest.join("-")}`; // vd "/th/bangkok", "/vn/hanoi"
  // slug bỏ dấu cho URL submarket (khớp resolveSubmarketId + pipeline slugify)
  const subSlug = area.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const currentPath = area.regionType === "submarket" ? `${basePath}/${subSlug}` : basePath;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      {/* Header + breadcrumb */}
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">
            {area.parentName ? (
              <>
                <Link href={`/${area.parentId!.split("-")[0]}/${area.parentId!.split("-").slice(1).join("-")}`} className="hover:underline">
                  {area.parentName}
                </Link>{" "}
                ›{" "}
              </>
            ) : null}
            Market Insights
          </div>
          <h1 className="text-3xl font-bold text-neutral-900">{area.name}</h1>
          <div className="text-sm text-neutral-500">
            {area.regionType === "market" ? "Market" : "Submarket"} ·{" "}
            {area.parentId === "th-bangkok" || areaId.startsWith("th-")
              ? "Inside Airbnb snapshot"
              : "Airbnb self-collected"}{" "}
            · {metrics.length} months loaded
          </div>
        </div>
        {area.regionType === "market" ? (
          <Link
            href={`${basePath}/map`}
            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
          >
            Open in Market Finder →
          </Link>
        ) : null}
        <AuthBar user={user} redirectTo={currentPath} />
        <form action={toggleSaved}>
          <input type="hidden" name="areaId" value={areaId} />
          <input type="hidden" name="redirectTo" value={currentPath} />
          <button
            type="submit"
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              saved
                ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                : "border border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            }`}
            title={user ? (saved ? "Remove from saved" : "Save this market") : "Sign in to save"}
          >
            {saved ? "★ Saved" : "☆ Save"}
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-3">
        <KpiStrip kpis={kpis} currency={currency} />
        {benchmark ? <BenchmarkBar benchmark={benchmark} currency={currency} /> : null}
        <MiniMap features={geo?.features ?? []} lat={geo?.lat ?? area.lat} lng={geo?.lng ?? area.lng} />
        <div className="grid gap-3 md:grid-cols-2">
          <MetricChart
            title="Average Daily Rate"
            subtitle="Listed-price basis, monthly"
            kind="money"
            points={points.map((p) => ({ label: p.label, value: p.adr }))}
          />
          <MetricChart
            title="Occupancy"
            subtitle="Booked ÷ available+booked, monthly"
            kind="pct"
            points={points.map((p) => ({ label: p.label, value: p.occupancy }))}
          />
          <MetricChart
            title="Revenue"
            subtitle="Sum of listed prices on booked nights, monthly"
            kind="money"
            points={points.map((p) => ({ label: p.label, value: p.revenue }))}
          />
          <MetricChart
            title="RevPAR"
            subtitle="Revenue per available night, monthly"
            kind="money"
            points={points.map((p) => ({ label: p.label, value: p.revpar }))}
          />
        </div>

        {/* M3′: các section sâu */}
        {topSubs && topSubs.length > 0 ? (
          <Section
            title="Top Submarkets"
            subtitle={`Ranked by 12-month listed-price revenue · latest-month ADR / occupancy / RevPAR`}
          >
            <TopSubmarkets rows={topSubs} currency={currency} basePath={basePath} sortBy={sortBy} />
          </Section>
        ) : null}

        {supply ? (
          <Section
            title="Supply tracking"
            subtitle="Discovery snapshots — search-paging xáo trộn giữa các lần chạy nên new/removed là 'mới xuất hiện/không còn thấy'"
          >
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
              <span className="font-semibold text-neutral-900">
                {fmtInt(supply.cumulative)} listings
              </span>
              <span className="text-neutral-500">đã từng thấy (union mọi snapshot)</span>
              <span className="text-neutral-600">
                snapshot gần nhất: {fmtInt(supply.points.at(-1)?.seen ?? 0)} thấy ·+
                {fmtInt(supply.points.at(-1)?.newVsPrev ?? 0)} mới
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {supply.points.map((p) => (
                <span
                  key={p.snapshotId}
                  className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600"
                  title={`+${p.newVsPrev} mới so với snapshot trước`}
                >
                  {p.date} · {p.seen}
                </span>
              ))}
            </div>
          </Section>
        ) : null}

        {yieldRows.length > 0 ? (
          <Section
            title="Yield theo phường/quận"
            subtitle="Giá bán + thuê dài hạn (từ tin rao) vs doanh thu STR (từ Airbnb) → hiệu suất đầu tư"
          >
            <div className="mb-2 inline-flex items-center gap-1.5 rounded bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
              ⚠ SIMULATED DATA — tin rao giả lập để build tính năng
            </div>
            <YieldCard rows={yieldRows} currency={currency} />
          </Section>
        ) : null}

        {airdna ? (
          <Section
            title="Đối chiếu AirDNA"
            subtitle="One Invest (tự thu) vs AirDNA Market Research (LTM) — 2 phương pháp độc lập"
          >
            <AirdnaCompare data={airdna} />
          </Section>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Section
            title="ADR by size"
            subtitle="Listed-price ADR theo số phòng ngủ, cửa sổ 12 tháng"
          >
            <BreakdownChart
              data={breakdown.bedrooms.map((b) => ({
                label: b.label,
                value: b.adr,
                note: `${fmtInt(b.listings)} listings · ${fmtPct(b.share)} revenue`,
              }))}
              kind="money"
              currency={currency}
            />
          </Section>
          <Section
            title="Revenue by listing type"
            subtitle={`Tỷ trọng revenue 12 tháng theo room type · ${currency}`}
          >
            <BreakdownChart
              data={breakdown.roomTypes.map((b) => ({
                label: b.label,
                value: b.share,
                note: `${fmtInt(b.listings)} listings · ADR ${fmtMoney(b.adr, currency)}`,
              }))}
              kind="pct"
              currency={currency}
            />
          </Section>
        </div>

        <Section
          title="Top Listings"
          subtitle="Estimated 12-month revenue = Σ listed price trên các đêm đã đặt (forward window)"
        >
          <TopListings rows={breakdown.topListings} currency={currency} />
        </Section>
      </div>
    </main>
  );
}
