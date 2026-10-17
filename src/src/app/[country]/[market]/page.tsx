export const dynamic = "force-dynamic";

import { AreaPage } from "@/components/area-page";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ country: string; market: string }>;
}) {
  const { country, market } = await params;
  return <AreaPage areaId={`${country}-${market}`} />;
}
