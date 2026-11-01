export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { InsightPage } from "@/components/insight/insight-page";
import { noiQuery, thiTruongDaDoi } from "@/lib/ma-thi-truong";
import { getArea } from "@/lib/queries";

type Params = Promise<{ country: string; market: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, market } = await params;
  const area = await getArea(`${country}-${market}`);
  return { title: area ? `${area.name} — Insight thị trường` : "Không tìm thấy" };
}

export default async function MarketPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { country, market } = await params;
  // Mã thị trường dài đã đổi sang mã ngắn (migration 064) → link cũ chuyển vĩnh viễn sang mã mới.
  const moi = await thiTruongDaDoi(country, market);
  if (moi) permanentRedirect(noiQuery(`/${country}/${moi}`, await searchParams));
  return <InsightPage areaId={`${country}-${market}`} />;
}
