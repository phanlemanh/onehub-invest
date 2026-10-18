export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { resolveSubmarketId } from "@/lib/queries";
import { AreaPage } from "@/components/area-page";

export default async function SubmarketPage({
  params,
}: {
  params: Promise<{ country: string; market: string; submarket: string }>;
}) {
  const { country, market, submarket } = await params;
  const areaId = await resolveSubmarketId(`${country}-${market}`, submarket);
  if (!areaId) notFound();
  return <AreaPage areaId={areaId} />;
}
