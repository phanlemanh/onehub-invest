import { Suspense } from "react";
import type { Metadata } from "next";

import { DataFlowSkeleton } from "@/components/ops/data-flow/data-flow-skeleton";
import { DataFlowView } from "@/components/ops/data-flow/data-flow-view";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { RegionError } from "@/components/states/region-error";
import { getSessionUser } from "@/lib/auth";
import { getDataFlow, loadFlowMedia, parseFlowWindow, type FlowWindow } from "@/lib/data-flow-queries";
import { isAdmin } from "@/lib/ops-access";
import { localOnlyTable } from "@/lib/ops-queries";
import { getSourceRoles } from "@/lib/source-roles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dòng chảy dữ liệu" };

/** Mốc "bây giờ" của request (trang force-dynamic, server component render một lần). */
function requestTime(): number {
  return Date.now();
}

/**
 * /ops/data-flow «Dòng chảy dữ liệu» (proto 26/10): đường ống bài → tin → căn, chất lượng từng chặng, tin mới nhất.
 * Đọc bảng nạp thô nên chỉ chạy ở máy thu; trên máy chủ (bảng stg_* vắng) dừng bằng LocalOnlyAlert.
 */
export default async function DataFlowPage({ searchParams }: PageProps<"/ops/data-flow">) {
  const window = parseFlowWindow((await searchParams).window);
  return (
    <RegionError what="dòng chảy dữ liệu">
      <Suspense key={window} fallback={<DataFlowSkeleton />}>
        <DataFlowContent window={window} />
      </Suspense>
    </RegionError>
  );
}

async function DataFlowContent({ window }: { window: FlowWindow }) {
  if (await localOnlyTable("stg_zalo_posts")) {
    return (
      <LocalOnlyAlert title="Chỉ xem ở máy thu">
        Dòng chảy đọc bảng nạp thô, mà bảng này không lên máy chủ. Mở cổng Ops trên máy thu để xem đường ống.
      </LocalOnlyAlert>
    );
  }
  const nowMs = requestTime();
  const [flow, roles, user] = await Promise.all([getDataFlow(window, { now: nowMs }), getSourceRoles(), getSessionUser()]);
  // Ảnh tin chỉ cho admin (cùng luật Hàng duyệt): người khác nhận `undefined` — không dữ liệu ảnh nào xuống trình duyệt.
  const media = isAdmin(user) ? await loadFlowMedia(flow.records, user) : undefined;
  return <DataFlowView flow={flow} roles={roles} nowMs={nowMs} media={media} />;
}
