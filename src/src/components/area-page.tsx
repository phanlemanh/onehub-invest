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
  getTopSubmarkets,
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
import { UpsellCard } from "@/components/upsell-card";

export async function AreaPage({ areaId }: { areaId: string }) {
  const area = await getArea(areaId);
  if (!area) notFound();

  const [metrics, kpis, benchmark, geo, breakdown, topSubs, user] = await Promise.all([
    getMetrics(areaId),
    getKpis(areaId),
    area.regionType === "submarket" ? getSiblingBenchmark(areaId) : Promise.resolve(null),
    getMarketGeoJson(area.parentId ?? areaId, areaId),
    getAreaBreakdown(areaId),
    area.regionType === "market" ? getTopSubmarkets(areaId, 10) : Promise.resolve(null),
    getSessionUser(),
  ]);
  const saved = user ? await isSaved(user.id, areaId) : false;

  const currency = currencyFor(areaId);
  const points = metrics.map((m) => ({ label: fmtMonth(m.month), ...m }));
  const [cc, ...rest] = area.id.split("-");
  const basePath = `/${cc}/${rest.join("-")}`;
  const slug = area.name.toLowerCase().replace(/\s+/g, "-");
  const currentPath = area.regionType === "submarket" ? `${basePath}/${slug}` : basePath;

  // Paywall (mirror AirDNA): free = field-level redaction trên KPI revenue +
  // endpoint-level 401 analog cho Revenue/RevPAR timeseries và Top Listings.
  const isPro = user?.plan === "pro";
  const kpiRedactions = isPro ? [] : ["revenue"];

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
            {area.regionType === "market" ? "Market" : "Submarket"} · Inside Airbnb snapshot ·{" "}
            {metrics.length} months loaded
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
        <KpiStrip kpis={kpis} currency={currency} redactions={kpiRedactions} />
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
          {isPro ? (
            <MetricChart
              title="Revenue"
              subtitle="Sum of listed prices on booked nights, monthly"
              kind="money"
              points={points.map((p) => ({ label: p.label, value: p.revenue }))}
            />
          ) : (
            <UpsellCard
              title="Revenue timeseries"
              description="Monthly revenue history requires Pro (mirror AirDNA: v2 metrics endpoints return 401 for free plans)."
            />
          )}
          {isPro ? (
            <MetricChart
              title="RevPAR"
              subtitle="Revenue per available night, monthly"
              kind="money"
              points={points.map((p) => ({ label: p.label, value: p.revpar }))}
            />
          ) : (
            <UpsellCard
              title="RevPAR timeseries"
              description="Revenue per available night history requires Pro."
            />
          )}
        </div>

        {/* M3′: các section sâu */}
        {topSubs && topSubs.length > 0 ? (
          <Section
            title="Top Submarkets"
            subtitle={`Ranked by 12-month listed-price revenue · latest-month ADR / occupancy / RevPAR`}
          >
            <TopSubmarkets rows={topSubs} currency={currency} basePath={basePath} />
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

        {isPro ? (
          <Section
            title="Top Listings"
            subtitle="Estimated 12-month revenue = Σ listed price trên các đêm đã đặt (forward window)"
          >
            <TopListings rows={breakdown.topListings} currency={currency} />
          </Section>
        ) : (
          <Section title="Top Listings" subtitle="Estimated 12-month revenue per listing">
            <UpsellCard
              title="Top Listings"
              description="Listing-level revenue estimates are Pro-only (mirror AirDNA: /listings endpoint 401 for free)."
            />
          </Section>
        )}
      </div>
    </main>
  );
}
