import { DataFlowView } from "@/components/ops/data-flow/data-flow-view";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import type { User } from "@/lib/auth";
import { getDataFlow, loadFlowMedia, type FlowWindow } from "@/lib/data-flow-queries";
import { isAdmin, xemNoiDungTin } from "@/lib/ops-access";
import { localOnlyTable } from "@/lib/ops-queries";
import { getSourceRoles } from "@/lib/source-roles";

/** Mốc "bây giờ" của request (trang force-dynamic, server component render một lần). */
function requestTime(): number {
  return Date.now();
}

/**
 * Thân /ops/data-flow sau bước đọc phiên (page.tsx). Đọc bảng nạp thô nên chỉ chạy ở máy thu; trên máy chủ (bảng stg_*
 * vắng) dừng bằng LocalOnlyAlert — trước mọi nhánh vai.
 */
export async function DataFlowContent({ window, user }: { window: FlowWindow; user: User | null }) {
  if (await localOnlyTable("stg_zalo_posts")) {
    return (
      <LocalOnlyAlert title="Chỉ xem ở máy thu">
        Dòng chảy đọc bảng nạp thô, mà bảng này không lên máy chủ. Mở cổng Ops trên máy thu để xem đường ống.
      </LocalOnlyAlert>
    );
  }
  const nowMs = requestTime();
  const [flow, roles] = await Promise.all([getDataFlow(window, { now: nowMs }), getSourceRoles()]);
  // Bài gốc + tên nhóm (nội dung tin) chỉ cho vai ops trở lên (AGENTS.md luật 6): xoá TRƯỚC khi trao cho thành phần
  // client — dữ liệu không xuống trình duyệt, không chỉ ẩn trên màn hình.
  const xem = xemNoiDungTin(user);
  const records = xem ? flow.records : flow.records.map((r) => ({ ...r, postText: null, postGroup: null }));
  // Ảnh tin chỉ cho admin (cùng luật Hàng duyệt): người khác nhận `undefined` — không dữ liệu ảnh nào xuống trình duyệt.
  const media = isAdmin(user) ? await loadFlowMedia(flow.records, user) : undefined;
  return <DataFlowView flow={{ ...flow, records }} roles={roles} nowMs={nowMs} media={media} xemBaiGoc={xem} />;
}
