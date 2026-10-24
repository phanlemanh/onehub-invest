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
      localOnly={localOnly}
      roles={roles}
    />
  );
}
