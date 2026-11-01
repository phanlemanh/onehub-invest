export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";

import { InsightPage } from "@/components/insight/insight-page";
import { noiQuery, thiTruongDaDoi } from "@/lib/ma-thi-truong";
import { getArea, resolveSubmarketId } from "@/lib/queries";

type Params = Promise<{ country: string; market: string; submarket: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { country, market, submarket } = await params;
  const areaId = await resolveSubmarketId(`${country}-${market}`, submarket);
  const area = areaId ? await getArea(areaId) : null;
  return {
    title: area ? `${area.name}, ${area.parentName ?? ""} — Insight phường` : "Không tìm thấy",
  };
}

export default async function SubmarketPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { country, market, submarket } = await params;
  const areaId = await resolveSubmarketId(`${country}-${market}`, submarket);
  if (!areaId) {
    // Thị trường mã dài đã đổi sang mã ngắn (migration 064): chuyển khi phường có dưới mã mới, không thì 404 như cũ.
    const moi = await thiTruongDaDoi(country, market);
    if (moi && (await resolveSubmarketId(`${country}-${moi}`, submarket))) {
      permanentRedirect(noiQuery(`/${country}/${moi}/${submarket}`, await searchParams));
    }
    notFound();
  }
  return <InsightPage areaId={areaId} />;
}
