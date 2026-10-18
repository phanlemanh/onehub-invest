export const dynamic = "force-dynamic";

import { AreaPage } from "@/components/area-page";

type SortKey = "revenue" | "adr" | "occupancy" | "revpar";
const SORTS: SortKey[] = ["revenue", "adr", "occupancy", "revpar"];

export default async function MarketPage({
  params,
  searchParams,
}: {
  params: Promise<{ country: string; market: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { country, market } = await params;
  const { sort } = await searchParams;
  const sortBy = SORTS.includes(sort as SortKey) ? (sort as SortKey) : "revenue";
  return <AreaPage areaId={`${country}-${market}`} sortBy={sortBy} />;
}
