import type { Metadata } from "next";

import { AirdnaMarketsTable, CalibrationEmptyLine, CalibrationTable, TruthfulCoverageTable } from "@/components/ops/quality-tables";
import { DqChecksTable } from "@/components/ops/quality/dq-checks-table";
import { PageHeader } from "@/components/page/page-header";
import { StatTiles } from "@/components/page/stat-tiles";
import type { StatTile } from "@/components/page/tiers";
import { splitCalibrated } from "@/lib/calibration";
import { fmtInt } from "@/lib/format";
import { dqSection, loadDqChecks } from "@/lib/dq-checks";
import { getAreaNames, getRulerHealth } from "@/lib/ops-queries";
import { shortAreaName } from "@/lib/market-names";
import { pool } from "@/lib/db";
import { getAirdnaComparison, getAirdnaMarkets, getTruthfulCoverage } from "@/lib/queries";
import { sourceLabel } from "@/lib/source-labels";
import { maskSourceNames } from "@/lib/mask-source-names";
import { priceTierLabel } from "@/lib/ops-labels";
import { getSourceNameEntries, getSourceRoles } from "@/lib/source-roles";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Chất lượng dữ liệu" };

/**
 * /ops/quality — đối chiếu số tự thu với AirDNA. AirDNA chỉ là nguồn hiệu
 * chuẩn (CLAUDE.md, IA rủi ro R1): số của họ CHỈ hiện ở Ops, không ở Invest.
 */
export default async function QualityPage() {
  const ruler = await getRulerHealth();
  // ON9: bản mới nhất theo (kiểm, đối tượng) — bảng và số đầu trang cùng một nguồn (dqSection bên dưới).
  const { rows: dqRaw } = await loadDqChecks(pool);
  const { rows: markets } = await pool.query<{ id: string; name: string }>(
    `SELECT id, name FROM areas WHERE region_type = 'market' ORDER BY name`,
  );
  const [comparisons, airdnaMarkets, truthful, roles, names, areaNames] = await Promise.all([
    Promise.all(
      markets.map(async (m) => ({ market: m, data: await getAirdnaComparison(m.id) })),
    ),
    getAirdnaMarkets(),
    getTruthfulCoverage(),
    getSourceRoles(),
    getSourceNameEntries(),
    getAreaNames(),
  ]);
  // ON7: chi tiết DQ là chữ do pipeline ghi — che tên nguồn thật (dòng cũ trong DB); không đọc được tên → ẩn (đóng chặt).
  const dq = dqSection(dqRaw, (d) => maskSourceNames(d, names));
  // ON10: thẻ chỉ cho thị trường có số; header đếm đúng số thẻ; thị trường còn lại gộp một dòng.
  const cal = splitCalibrated(comparisons);

  const tiles: StatTile[] = [
    {
      title: "Phường có thước P2",
      value: `${fmtInt(ruler.phuongWithRuler)} / ${fmtInt(ruler.totalPhuong)}`,
      footer: "Thước giá P2 cần n ≥ 5 tin",
    },
    ...ruler.offersByTier.map((t) => ({
      title: `Tin rao ${priceTierLabel(t.tier).known ? priceTierLabel(t.tier).label : t.tier}`,
      value: fmtInt(t.offers),
      footer: "Ba bậc giá",
    })),
    {
      title: "Người bán",
      value: fmtInt(ruler.sellers),
      footer: `${fmtInt(ruler.gapOffers)} tin có chênh giá câu`,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        crumbs={[{ label: "Vận hành", href: "/ops" }, { label: "Chất lượng dữ liệu" }]}
        title="Chất lượng dữ liệu"
        stats={[...dq.stats.labels, cal.label]}
        description={`Đối chiếu số tự thu với ${sourceLabel("S02", roles)} — chỉ nội bộ, không hiện cho nhà đầu tư.`}
      />
      {/* H3-P3: chất lượng thước P2 + phân bố tier (kiến trúc 3 tầng giá) */}
      <StatTiles items={tiles} />
      {/* ON9: bản mới nhất của mỗi kiểm theo từng đối tượng (7 ngày) — chữ kiểm/đối tượng/chi tiết theo ON12 */}
      <DqChecksTable rows={dq.rows} areaNames={areaNames} />
      <TruthfulCoverageTable rows={truthful} roles={roles} />
      {cal.calibrated.map(({ market, data }) => (
        <CalibrationTable key={market.id} marketName={shortAreaName(market.name)} data={data} roles={roles} />
      ))}
      <CalibrationEmptyLine names={cal.empty} />
      <AirdnaMarketsTable rows={airdnaMarkets} roles={roles} areaNames={areaNames} />
    </div>
  );
}
