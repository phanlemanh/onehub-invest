import type { User } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import { getDataFlow, loadFlowMedia, type FlowWindow } from "@/lib/data-flow-queries";
import { isAdmin, xemNoiDungTin } from "@/lib/ops-access";
import { getSourceRoles } from "@/lib/source-roles";

import { DataFlowView } from "./data-flow-view";

/**
 * Nội dung /ops/data-flow (DF1): một đường cho cả hai nơi. `getDataFlow` nhận nơi chạy theo `VERCEL` — máy thu đọc bảng tính
 * sẵn `data_flow_snapshot`, máy chủ đọc khối `dataFlow` của bản tin — nên không còn cổng «không thấy stg_* thì dừng».
 * `getUser` tiêm được để phép đo dựng route ngoài request (mặc định phiên đăng nhập thật).
 */
export async function DataFlowContent({
  window,
  nowMs,
  getUser = getSessionUser,
}: {
  window: FlowWindow;
  nowMs: number;
  getUser?: () => Promise<User | null>;
}) {
  const [flow, roles, user] = await Promise.all([getDataFlow(window, { now: nowMs }), getSourceRoles(), getUser()]);
  // Bài gốc + tên nhóm (nội dung tin) chỉ cho vai ops trở lên (AGENTS.md luật 6): xoá TRƯỚC khi trao cho thành phần
  // client — dữ liệu không xuống trình duyệt, không chỉ ẩn trên màn hình.
  const xem = xemNoiDungTin(user);
  const records = xem ? flow.records : flow.records.map((r) => ({ ...r, postText: null, postGroup: null }));
  // Ảnh tin chỉ cho admin ở máy thu (cùng luật Hàng duyệt; bảng ảnh không lên máy chủ — TV9): người khác nhận
  // `undefined`, không dữ liệu ảnh nào xuống trình duyệt.
  const media = flow.mode === "local" && isAdmin(user) ? await loadFlowMedia(flow.records, user) : undefined;
  return <DataFlowView flow={{ ...flow, records }} roles={roles} nowMs={nowMs} media={media} xemBaiGoc={xem} />;
}
