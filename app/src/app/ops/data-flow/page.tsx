import { Suspense } from "react";
import type { Metadata } from "next";

import { DataFlowContent } from "@/components/ops/data-flow/data-flow-content";
import { DataFlowSkeleton } from "@/components/ops/data-flow/data-flow-skeleton";
import { RegionError } from "@/components/states/region-error";
import { parseFlowWindow } from "@/lib/data-flow-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dòng chảy dữ liệu" };

/** Mốc "bây giờ" của request (trang force-dynamic, server component render một lần). */
function requestTime(): number {
  return Date.now();
}

/**
 * /ops/data-flow «Dòng chảy dữ liệu»: đường ống bài → tin → căn, chất lượng từng chặng, tin mới nhất. Chạy ở cả máy thu
 * (bảng tính sẵn) lẫn máy chủ (khối bản tin) — DF1 `dong-chay-len-cloud`.
 */
export default async function DataFlowPage({ searchParams }: PageProps<"/ops/data-flow">) {
  const window = parseFlowWindow((await searchParams).window);
  return (
    <RegionError what="dòng chảy dữ liệu">
      <Suspense key={window} fallback={<DataFlowSkeleton />}>
        <DataFlowContent window={window} nowMs={requestTime()} />
      </Suspense>
    </RegionError>
  );
}
