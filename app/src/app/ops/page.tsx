import type { Metadata } from "next";

import { ObjectivesGrid } from "@/components/ops/overview/objectives-grid";
import { OverviewTiles } from "@/components/ops/overview/overview-tiles";
import { PageHeader } from "@/components/page/page-header";
import { fmtInt } from "@/lib/format";
import { getCoverageOverview } from "@/lib/ops-queries";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tổng quan vận hành" };

/** /ops — freshness SLO từng nguồn × city (ADR-0007 DQO + DCA: cùng dữ liệu với /api/v1/ops/coverage).
 * Khung theo @reui/solution-dev-ops-5: hàng ô KPI rồi lưới mục tiêu. */
export default async function OpsOverviewPage() {
  const rows = await getCoverageOverview();
  const stale = rows.filter((r) => r.status === "stale").length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Vận hành" }]}
        title="Tổng quan"
        stats={[`${fmtInt(new Set(rows.map((r) => r.code)).size)} nguồn`, `${fmtInt(stale)} quá hạn`]}
        description="Độ tươi dữ liệu theo nguồn (mã SPL) và thị trường."
      />
      <OverviewTiles rows={rows} />
      <ObjectivesGrid rows={rows} />
    </div>
  );
}
