export const dynamic = "force-dynamic";

import type { Metadata } from "next";

import { CompareBody } from "@/components/compare/compare-body";
import { COMPARE_MAX } from "@/components/compare/compare-types";
import { getSearchIndex } from "@/lib/queries";

export const metadata: Metadata = { title: "So sánh khu vực" };

/**
 * So sánh tối đa 4 khu vực (IA §3.2) — comparison-1 chuyển thể, số cùng nguồn Finder.
 * Trang chỉ đọc chỉ mục khu vực (một truy vấn nhẹ) để lọc mã trên URL; thân trang ở CompareBody.
 */
export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ areas?: string }>;
}) {
  const { areas: raw } = await searchParams;
  const entries = await getSearchIndex();
  const known = new Set(entries.map((e) => e.id));
  // Mã lạ hoặc trùng bị bỏ; thứ tự cột theo URL.
  const ids = [...new Set((raw ?? "").split(",").map((s) => s.trim()).filter((id) => known.has(id)))].slice(
    0,
    COMPARE_MAX,
  );
  return <CompareBody entries={entries} ids={ids} />;
}
