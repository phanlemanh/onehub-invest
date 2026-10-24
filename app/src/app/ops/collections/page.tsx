import type { Metadata } from "next";

import { CollectionsView } from "@/components/ops/collections/collections-view";
import {
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
import { getCloudOpsView } from "@/lib/ops-cloud";
import { getSourceRoles } from "@/lib/source-roles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thu thập" };

/** Mốc "bây giờ" của request (trang force-dynamic, server component render một lần). */
function requestTime(): number {
  return Date.now();
}

/** /ops/collections "Thu Thập" (portals.md) — chỉ tải dữ liệu; phần hiển thị ở CollectionsView. */
export default async function CollectionsPage() {
  const [days, funnel, jobs, rotation, zaloGroups, zaloAllowlist, zaloHealth, factsPushedAt, feedHealth, lockdown, localOnly, roles] = await Promise.all([
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
    freshnessLocalOnly(),
    getSourceRoles(),
  ]);
  // Cloud (bảng tầng A vắng): ô số đọc từ bản tin máy local (ON3, ADR-0014).
  const cloud = localOnly ? await getCloudOpsView() : null;
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
      feedHealth={cloud ? (cloud.feeds ?? []) : feedHealth}
      lockdown={lockdown}
      nowMs={requestTime()}
      cloud={cloud}
      roles={roles}
    />
  );
}
