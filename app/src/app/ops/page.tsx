import type { Metadata } from "next";

import { FactsStaleAlert, FactsStamp } from "@/components/ops/facts-status";
import { LocalOnlyAlert } from "@/components/ops/local-only-alert";
import { ObjectivesGrid } from "@/components/ops/overview/objectives-grid";
import { OverviewTiles } from "@/components/ops/overview/overview-tiles";
import { PageHeader } from "@/components/page/page-header";
import { fmtInt } from "@/lib/format";
import { sloSummaryKey, sloSummaryText, summarizeFreshness } from "@/lib/freshness";
import { getCloudOpsView } from "@/lib/ops-cloud";
import { freshnessLocalOnly, getAreaNames, getCoverageOverview } from "@/lib/ops-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tổng quan vận hành" };

/** /ops — freshness SLO từng nguồn × city theo định nghĩa chung lib/freshness (ADR-0007 DQO + DCA: cùng dữ liệu với
 * /api/v1/ops/coverage; cùng con số «x/y nguồn đạt SLO» với /ops/collections — AU6).
 * Khung theo @reui/solution-dev-ops-5: hàng ô KPI rồi lưới mục tiêu. */
export default async function OpsOverviewPage() {
  // Cloud (bảng tầng A vắng): số lấy từ bản tin máy thu đẩy lên (ON3, ADR-0014); máy thu: đo trực tiếp như cũ.
  const localOnly = await freshnessLocalOnly();
  const cloud = localOnly ? await getCloudOpsView() : null;
  const [rows, areaNames] = await Promise.all([cloud ? Promise.resolve(cloud.coverage ?? []) : getCoverageOverview(), getAreaNames()]);
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
        description="Độ tươi dữ liệu theo nguồn (mã nguồn) và thị trường."
      />
      {cloud ? <FactsStamp state={cloud.state} measuredAt={cloud.measuredAt} /> : null}
      {cloud ? <FactsStaleAlert state={cloud.state} measuredAt={cloud.measuredAt} /> : null}
      {cloud?.state === "none" ? (
        <LocalOnlyAlert title="Chỉ đo ở máy thu">
          Máy thu chưa đẩy số tổng hợp lên máy chủ. Kiểm tác vụ đồng bộ ở máy thu, hoặc xem cổng Ops trên máy thu.
        </LocalOnlyAlert>
      ) : null}
      <OverviewTiles rows={rows} unmeasured={unmeasured} stale={cloud?.state === "stale"} areaNames={areaNames} />
      <ObjectivesGrid rows={rows} stale={cloud?.state === "stale"} areaNames={areaNames} />
    </div>
  );
}
