export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getArea, getSubmarketChoropleth } from "@/lib/queries";
import { currencyFor } from "@/lib/queries";
import { FinderMap } from "@/components/finder-map";

export default async function FinderPage({
  params,
}: {
  params: Promise<{ country: string; market: string }>;
}) {
  const { country, market } = await params;
  const marketId = `${country}-${market}`;
  const area = await getArea(marketId);
  if (!area) notFound();

  const features = await getSubmarketChoropleth(marketId);
  if (features.length === 0) notFound();
  const anchor = features.reduce((a, b) => (b.metrics.revenue > a.metrics.revenue ? b : a));

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="text-xs uppercase tracking-wide text-neutral-500">
        <Link href={`/${country}/${market}`} className="hover:underline">
          {area.name}
        </Link>{" "}
        › Market Finder
      </div>
      <h1 className="text-3xl font-bold text-neutral-900">{area.name} — Market Finder</h1>
      <div className="text-sm text-neutral-500">
        Choropleth theo percentile của tập submarket · Inside Airbnb snapshot
      </div>

      <div className="mt-6">
        {/* Center tại submarket đứng đầu revenue — tránh tâm bbox rơi vào sông */}
        <FinderMap
          features={features}
          centerLat={anchor.lat}
          centerLng={anchor.lng}
          currency={currencyFor(marketId)}
          basePath={`/${country}/${market}`}
        />
      </div>
    </main>
  );
}
