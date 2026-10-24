import type { Metadata } from "next";

import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { ObjectivesGrid } from "@/components/ops/overview/objectives-grid";
import { OverviewTiles } from "@/components/ops/overview/overview-tiles";
import { PageHeader } from "@/components/page/page-header";
import { fmtInt } from "@/lib/format";
import { sloSummaryKey, sloSummaryText, summarizeFreshness } from "@/lib/freshness";
import { getCloudOpsView } from "@/lib/ops-cloud";
import { freshnessLocalOnly, getCoverageOverview } from "@/lib/ops-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tổng quan vận hành" };

/** /ops — freshness SLO từng nguồn × city theo định nghĩa chung lib/freshness (ADR-0007 DQO + DCA: cùng dữ liệu với
 * /api/v1/ops/coverage; cùng con số «x/y nguồn đạt SLO» với /ops/collections — AU6).
 * Khung theo @reui/solution-dev-ops-5: hàng ô KPI rồi lưới mục tiêu. */
export default async function OpsOverviewPage() {
  // Cloud (bảng tầng A vắng): số lấy từ bản tin máy local đẩy lên (ON3, ADR-0014); local: đo trực tiếp như cũ.
  const localOnly = await freshnessLocalOnly();
  const cloud = localOnly ? await getCloudOpsView() : null;
  const rows = cloud ? (cloud.coverage ?? []) : await getCoverageOverview();
  const unmeasured = cloud !== null && cloud.coverage === null;
  const stale = rows.filter((r) => r.status === "stale").length;
  // Cùng một con số với /ops/collections (AU6): x/y nguồn đạt SLO.
  const slo = summarizeFreshness(rows);

  return (
    <div className="flex flex-col gap-6" data-slo-summary={sloSummaryKey(slo)}>
      <PageHeader
        crumbs={[{ label: "Vận hành" }]}
        title="Tổng quan"
        stats={unmeasured ? [] : [sloSummaryText(slo), `${fmtInt(stale)} cặp quá hạn`]}
        description="Độ tươi dữ liệu theo nguồn (mã SPL) và thị trường."
      />
      {cloud ? <FactsStamp state={cloud.state} measuredAt={cloud.measuredAt} /> : null}
      {cloud ? <FactsStaleAlert state={cloud.state} measuredAt={cloud.measuredAt} /> : null}
      {cloud?.state === "none" ? (
        <LocalOnlyAlert title="Chỉ đo ở máy local">
          Máy local chưa đẩy số tổng hợp lên cloud. Kiểm cloud-sync ở máy thu, hoặc xem Ops trên máy thu.
        </LocalOnlyAlert>
      ) : null}
      <OverviewTiles rows={rows} unmeasured={unmeasured} stale={cloud?.state === "stale"} />
      <ObjectivesGrid rows={rows} />
    </div>
  );
}
