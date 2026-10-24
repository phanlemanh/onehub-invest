import type { Metadata } from "next";

import { AirdnaMarketsTable, CalibrationTable, TruthfulCoverageTable } from "@/components/ops/quality-tables";
import { DqChecksTable, type DqCheckRow } from "@/components/ops/quality/dq-checks-table";
import { PageHeader } from "@/components/page/page-header";
import { StatTiles } from "@/components/page/stat-tiles";
import type { StatTile } from "@/components/page/tiers";
import { fmtInt } from "@/lib/format";
import { getRulerHealth } from "@/lib/ops-queries";
import { pool } from "@/lib/db";
import { getAirdnaComparison, getAirdnaMarkets, getTruthfulCoverage } from "@/lib/queries";
import { sourceLabel } from "@/lib/source-labels";
import { maskSourceNames } from "@/lib/mask-source-names";
import { getSourceNameEntries, getSourceRoles } from "@/lib/source-roles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chất lượng dữ liệu" };

/**
 * /ops/quality — đối chiếu số tự thu với AirDNA. AirDNA chỉ là nguồn hiệu
 * chuẩn (CLAUDE.md, IA rủi ro R1): số của họ CHỈ hiện ở Ops, không ở Invest.
 */
export default async function QualityPage() {
  const ruler = await getRulerHealth();
  const { rows: dq } = await pool.query<DqCheckRow>(
    `SELECT check_name, entity, status, detail, checked_at::text FROM dq_check_results
     WHERE checked_at > now() - interval '7 days' ORDER BY checked_at DESC LIMIT 20`,
  );
  const { rows: markets } = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM areas WHERE region_type = 'market' ORDER BY name`,
  );
  const [comparisons, airdnaMarkets, truthful, roles, names] = await Promise.all([
    Promise.all(
      markets.map(async (m) => ({ market: m, data: await getAirdnaComparison(m.id) })),
    ),
    getAirdnaMarkets(),
    getTruthfulCoverage(),
    getSourceRoles(),
    getSourceNameEntries(),
  ]);
  // ON7: chi tiết DQ là chữ do pipeline ghi — che tên nguồn thật (dòng cũ trong DB); không đọc được tên → ẩn (đóng chặt).
  const dqShown = dq.map((r) => ({ ...r, detail: r.detail === null ? null : maskSourceNames(r.detail, names) }));
  const calibrated = comparisons.filter((c) => c.data !== null);

  const tiles: StatTile[] = [
    {
      title: "Phường có thước P2",
      value: `${fmtInt(ruler.phuongWithRuler)} / ${fmtInt(ruler.totalPhuong)}`,
      footer: "Thước giá P2 cần n ≥ 5 tin",
    },
    ...ruler.offersByTier.map((t) => ({
      title: `Offers tầng ${t.tier}`,
      value: fmtInt(t.offers),
      footer: "Kiến trúc 3 tầng giá",
    })),
    {
      title: "Người bán",
      value: fmtInt(ruler.sellers),
      footer: `${fmtInt(ruler.gapOffers)} offers có bait_gap`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Chất lượng dữ liệu" }]}
        title="Chất lượng dữ liệu"
        stats={[`${fmtInt(dq.length)} kiểm`, `${fmtInt(calibrated.length)} thị trường hiệu chuẩn`]}
        description={`Đối chiếu số tự thu với ${sourceLabel("S02", roles)} — chỉ nội bộ, không hiện cho nhà đầu tư.`}
      />
      {/* H3-P3: chất lượng thước P2 + phân bố tier (kiến trúc 3 tầng giá) */}
      <StatTiles items={tiles} />
      {/* G-1 Lô 2: kết quả DQ checks gần nhất (enum-vocab + các check khác) */}
      <DqChecksTable rows={dqShown} />
      <TruthfulCoverageTable rows={truthful} roles={roles} />
      {calibrated.map(({ market, data }) => (
        <CalibrationTable key={market.id} marketName={market.name} data={data!} roles={roles} />
      ))}
      <AirdnaMarketsTable rows={airdnaMarkets} roles={roles} />
    </div>
  );
}
