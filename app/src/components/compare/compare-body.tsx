import { Suspense } from "react";

import { PageHeader } from "@/components/page/page-header";
import { RegionError } from "@/components/states/region-error";
import { fmtInt, fmtMoney, fmtMoneyCompact, fmtPct } from "@/lib/format";
import { currencyFor, getAreaThumbnails, getFinderAreas, getYieldRows, type SearchEntry, type YieldRow } from "@/lib/queries";
import { CompareAddArea } from "./compare-add-area";
import { CompareSkeleton } from "./compare-skeleton";
import { AreaComparison } from "./comparison";
import { COMPARE_MAX, type CompareArea, type CompareGroup } from "./compare-types";

const GROUPS: CompareGroup[] = [
  {
    id: "performance",
    label: "Hiệu suất",
    rows: [
      { id: "revpar", label: "RevPAR", hint: "Doanh thu ÷ đêm khả dụng — gộp giá và công suất.", better: "high" },
      { id: "occupancy", label: "Công suất", hint: "Đêm đã đặt ÷ (đã đặt + còn trống).", better: "high" },
      { id: "adr", label: "Giá phòng (ADR)", hint: "Doanh thu ÷ đêm đã đặt.", better: null },
      { id: "revenue", label: "Doanh thu", hint: "Tổng giá niêm yết đêm đã đặt, cả khu vực.", better: "high" },
      { id: "listings", label: "Listing", hint: "Số listing có lịch cao nhất trong một tháng.", better: null },
    ],
  },
  {
    id: "yield",
    label: "Lợi suất (căn 60 m²)",
    badge: "Mô phỏng",
    rows: [
      { id: "perm2", label: "Giá bán / m²", better: "low" },
      { id: "rentLt", label: "Thuê dài hạn / tháng", better: null },
      { id: "yieldStr", label: "Lợi suất ngắn hạn", hint: "Gộp: doanh thu thuê ngắn hạn một năm ÷ giá mua, trước chi phí, theo một căn.", better: "high" },
      { id: "yieldLt", label: "Lợi suất dài hạn", hint: "Gộp: tiền thuê dài hạn một năm ÷ giá mua, trước thuế.", better: "high" },
    ],
  },
];

/**
 * Thân trang So sánh (server). PageHeader đứng ngay với số cột đúng (mã đã lọc theo chỉ mục khu vực);
 * bảng số (Finder + lợi suất từng thị trường) tải trong Suspense theo key cột, lỗi thì báo tại vùng
 * (RegionError) có Thử lại — header vẫn đứng.
 */
export function CompareBody({ entries, ids }: { entries: SearchEntry[]; ids: string[] }) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Việt Nam", href: "/vn" }, { label: "So sánh" }]}
        title="So sánh khu vực"
        stats={[`${ids.length}/${COMPARE_MAX} khu vực`]}
        description={`Đặt cạnh nhau tối đa ${COMPARE_MAX} thị trường hoặc phường`}
        actions={<CompareAddArea entries={entries} ids={ids} />}
      />
      <RegionError what="bảng so sánh">
        <Suspense key={ids.join(",")} fallback={<CompareSkeleton columns={ids.length} />}>
          <CompareTable ids={ids} />
        </Suspense>
      </RegionError>
    </div>
  );
}

export async function CompareTable({ ids }: { ids: string[] }) {
  const [rows, thumbs] = await Promise.all([getFinderAreas({ ids }, { geometry: false }), getAreaThumbnails(ids)]);
  // Lợi suất theo phường của các thị trường liên quan.
  const marketIds = [...new Set(rows.map((r) => r.id.split("-").slice(0, 2).join("-")))];
  const yieldById = new Map<string, YieldRow>();
  for (const m of marketIds) for (const y of await getYieldRows(m)) yieldById.set(y.areaId, y);

  const byId = new Map(rows.map((r) => [r.id, r]));
  const areas: CompareArea[] = ids.flatMap((id) => {
    const r = byId.get(id);
    if (!r) return [];
    const currency = currencyFor(id);
    const y = yieldById.get(id);
    const money = (v: number | null) => (v ? { text: fmtMoney(v, currency), raw: v } : null);
    const compact = (v: number | null) => (v ? { text: fmtMoneyCompact(v, currency), raw: v } : null);
    const pct = (v: number | null) => (v !== null ? { text: fmtPct(v), raw: v } : null);
    return [
      {
        id,
        name: r.name,
        parentName: r.parentName,
        href: r.href,
        headline: r.revpar ? fmtMoney(r.revpar, currency) : "—",
        thumbnail: thumbs.get(id) ?? null,
        values: {
          revpar: money(r.revpar),
          occupancy: pct(r.occupancy),
          adr: money(r.adr),
          revenue: compact(r.revenue),
          listings: { text: fmtInt(r.listings), raw: r.listings },
          perm2: compact(y?.medianPerm2 ?? null),
          rentLt: compact(y?.medianRentLt ?? null),
          yieldStr: pct(y?.yieldStr ?? null),
          yieldLt: pct(y?.yieldLt ?? null),
        },
      },
    ];
  });
  const hasYield = areas.some((a) => a.values.yieldLt || a.values.yieldStr);

  return <AreaComparison areas={areas} groups={hasYield ? GROUPS : GROUPS.filter((g) => g.id !== "yield")} />;
}
