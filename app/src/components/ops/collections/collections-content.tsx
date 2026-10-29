import type { User } from "@/lib/auth";
import { getSessionUser } from "@/lib/auth";
import {
  cheDinhDanhThu,
  getCloudFlowDays,
  getFlowDays,
  getFactsPushedAt,
  readGateFunnel,
  readRotationPreview,
  readSchedulerStatus,
  readZaloAllowlist,
  readZaloHealth,
  getZaloGroups,
} from "@/lib/collections-queries";
import { xemDinhDanhThu } from "@/lib/ops-access";
import { freshnessLocalOnly, getSourceFeedHealth, getLockdownStatus } from "@/lib/ops-queries";
import { getCloudOpsView, withLockdownGates } from "@/lib/ops-cloud";
import { getSourceRoles } from "@/lib/source-roles";

import { CollectionsView, type CollectionsData } from "./collections-view";

/** Dữ liệu trang Thu thập ở máy thu hoặc trên cloud (ON3, ADR-0014) — tách khỏi page.tsx để ca thử tiêm nguồn. */
export async function docTrangThuThap(nowMs: number): Promise<CollectionsData> {
  // Cloud (bảng tầng A vắng): chỉ tải phần đọc bản tin máy local (ON3, ADR-0014) — các vùng đo trực tiếp trên máy thu
  // (luồng 7 ngày, ống S03, xoay vòng, nhóm S03, lockdown) không dựng trên cloud nên không truy vấn bảng thô.
  if (await freshnessLocalOnly()) {
    const [cloud, funnel, factsPushedAt, roles] = await Promise.all([getCloudOpsView(), readGateFunnel(), getFactsPushedAt(), getSourceRoles()]);
    // Lưới job đọc khối job của bản tin; chưa có bản tin thì không đọc (nhánh dò launchd chỉ có nghĩa trên máy thu).
    // Kev gate / collector API cùng trạng thái với khối khoá an toàn (ON23).
    const jobs = cloud.state === "none" ? [] : withLockdownGates(await readSchedulerStatus(), cloud.lockdown);
    // «Luồng 7 ngày» (ON5): hai cột S03 từ khối luong7, listing tươi từ bảng đã đồng bộ; chưa có bản tin thì không dựng.
    const cloudDays = cloud.state === "none" ? [] : await getCloudFlowDays(cloud.luong7, { now: nowMs });
    return { ...CLOUD_EMPTY, funnel, jobs, factsPushedAt, feedHealth: cloud.feeds ?? [], nowMs, cloud, cloudDays, roles };
  }
  const [days, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, factsPushedAt, feedHealth, lockdown, roles] = await Promise.all([
    getFlowDays(7),
    readGateFunnel(),
    readSchedulerStatus(),
    readRotationPreview(),
    getZaloGroups(),
    readZaloAllowlist(),
    readZaloHealth(),
    getFactsPushedAt(),
    getSourceFeedHealth(),
    getLockdownStatus(),
    getSourceRoles(),
  ]);
  return { days, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, factsPushedAt, feedHealth, lockdown, nowMs, roles };
}

/**
 * Thân /ops/collections. Người xem dưới vai ops nhận bản đã che định danh tài khoản thu và mã nhóm TRƯỚC khi trao cho
 * thành phần client (hồ sơ dinh-danh-tai-khoan-thu-theo-vai, Hỏi-2 = A) — dữ liệu không xuống trình duyệt.
 * `getUser`, `doc` tiêm được để ca thử dựng ngoài request.
 */
export async function CollectionsContent({
  nowMs,
  getUser = getSessionUser,
  doc = docTrangThuThap,
}: {
  nowMs: number;
  getUser?: () => Promise<User | null>;
  doc?: (nowMs: number) => Promise<CollectionsData>;
}) {
  const [data, user] = await Promise.all([doc(nowMs), getUser()]);
  return <CollectionsView {...(xemDinhDanhThu(user) ? data : cheDinhDanhThu(data))} />;
}

/** Props của các vùng không dựng trên cloud — giữ kiểu CollectionsData, không mang số nào. */
const CLOUD_EMPTY = {
  days: [],
  jobs: [],
  rotation: { updatedAt: null, cursor: 0, total: 0, next: [] },
  zaloGroups: [],
  zaloAllowlist: [],
  zaloHealth: { connected: null, uptime24h: null, heartbeatAgeMin: null, lastHeartbeatAt: null, lastPostAt: null, silentAlert24h: false, driftAlert24h: false },
  lockdown: { layers: [], lastWatchdogAt: null, agentTurnsToday: null, openClawUp: false, kevUp: false, collectorUp: false },
} satisfies Partial<CollectionsData>;
