import { Suspense } from "react";

import { PageHeader } from "@/components/page/page-header";
import { RegionError } from "@/components/states/region-error";
import type { getSavedAreas } from "@/lib/auth";
import { fmtInt } from "@/lib/format";
import { currencyFor, getAreaThumbnails, getFinderAreas } from "@/lib/queries";
import { SavedEmpty } from "./saved-empty";
import { SavedCompareButton, SavedFilterProvider } from "./saved-filter";
import type { SavedArea } from "./saved-item";
import { SavedList } from "./saved-list";
import { SavedSkeleton } from "./saved-skeleton";

export type Saved = Awaited<ReturnType<typeof getSavedAreas>>;

/**
 * Thân trang Đã lưu (server). PageHeader + nút So sánh đứng ngoài vùng tải; trống hẳn → c-empty-11;
 * có lưu → số liệu thẻ tải trong Suspense, lỗi báo tại vùng (RegionError) có Thử lại.
 */
export function SavedBody({ saved, email }: { saved: Saved; email: string }) {
  const refs = saved.map((s) => ({ id: s.id, regionType: s.regionType === "market" ? "market" : "submarket" } as const));
  return (
    <SavedFilterProvider>
      <div className="flex flex-col gap-6">
        <PageHeader
          crumbs={[{ label: "Việt Nam", href: "/vn" }, { label: "Đã lưu" }]}
          title="Đã lưu"
          stats={[`${fmtInt(saved.length)} khu vực`]}
          description={`Khu vực đang theo dõi của ${email}`}
          actions={<SavedCompareButton areas={refs} />}
        />
        {saved.length === 0 ? (
          <SavedEmpty />
        ) : (
          <RegionError what="số liệu khu vực đã lưu">
            <Suspense fallback={<SavedSkeleton count={saved.length} />}>
              <SavedGrid saved={saved} />
            </Suspense>
          </RegionError>
        )}
      </div>
    </SavedFilterProvider>
  );
}

export async function SavedGrid({ saved }: { saved: Saved }) {
  const ids = saved.map((s) => s.id);
  const [finder, thumbs] = await Promise.all([getFinderAreas({ ids }, { geometry: false }), getAreaThumbnails(ids)]);
  const metrics = new Map(finder.map((r) => [r.id, r]));
  const areas: SavedArea[] = saved.map((s) => {
    const m = metrics.get(s.id);
    return {
      id: s.id,
      name: s.name,
      parentName: m?.parentName ?? null,
      regionType: s.regionType === "market" ? "market" : "submarket",
      href: m?.href ?? s.href,
      savedAt: s.savedAt,
      listings: m?.listings ?? null,
      revpar: m?.revpar ?? null,
      occupancy: m?.occupancy ?? null,
      adr: m?.adr ?? null,
      currency: currencyFor(s.id),
      thumbnail: thumbs.get(s.id) ?? null,
    };
  });
  return <SavedList areas={areas} />;
}
