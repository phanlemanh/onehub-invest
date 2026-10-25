import type { Metadata } from "next";

import { CollectionsView, type CollectionsData } from "@/components/ops/collections/collections-view";
import {
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
import { freshnessLocalOnly, getSourceFeedHealth, getLockdownStatus } from "@/lib/ops-queries";
import { getCloudOpsView, withLockdownGates } from "@/lib/ops-cloud";
import { getSourceRoles } from "@/lib/source-roles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thu thập" };

/** Mốc "bây giờ" của request (trang force-dynamic, server component render một lần). */
function requestTime(): number {
  return Date.now();
}

/** /ops/collections "Thu Thập" (portals.md) — chỉ tải dữ liệu; phần hiển thị ở CollectionsView. */
export default async function CollectionsPage() {
  // Cloud (bảng tầng A vắng): chỉ tải phần đọc bản tin máy local (ON3, ADR-0014) — các vùng đo trực tiếp trên máy thu
  // (luồng 7 ngày, ống S03, xoay vòng, nhóm S03, lockdown) không dựng trên cloud nên không truy vấn bảng thô.
  if (await freshnessLocalOnly()) {
    const [cloud, funnel, factsPushedAt, roles] = await Promise.all([getCloudOpsView(), readGateFunnel(), getFactsPushedAt(), getSourceRoles()]);
    // Lưới job đọc khối job của bản tin; chưa có bản tin thì không đọc (nhánh dò launchd chỉ có nghĩa trên máy thu).
    // Kev gate / collector API cùng trạng thái với khối khoá an toàn (ON23).
    const jobs = cloud.state === "none" ? [] : withLockdownGates(await readSchedulerStatus(), cloud.lockdown);
    // «Luồng 7 ngày» (ON5): hai cột S03 từ khối luong7, listing tươi từ bảng đã đồng bộ; chưa có bản tin thì không dựng.
    const nowMs = requestTime();
    const cloudDays = cloud.state === "none" ? [] : await getCloudFlowDays(cloud.luong7, { now: nowMs });
    return (
      <CollectionsView
        {...CLOUD_EMPTY}
        funnel={funnel}
        jobs={jobs}
        factsPushedAt={factsPushedAt}
        feedHealth={cloud.feeds ?? []}
        nowMs={nowMs}
        cloud={cloud}
        cloudDays={cloudDays}
        roles={roles}
      />
    );
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
  return (
    <CollectionsView
      days={days}
      funnel={funnel}
      jobs={jobs}
      rotation={rotation}
      zaloGroups={zaloGroups}
      zaloAllowlist={zaloAllowlist}
      zaloHealth={zaloHealth}
      factsPushedAt={factsPushedAt}
      feedHealth={feedHealth}
      lockdown={lockdown}
      nowMs={requestTime()}
      roles={roles}
    />
  );
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
