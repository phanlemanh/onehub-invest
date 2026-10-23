import { pool } from "./db";

/**
 * G3 — Mô phỏng đầu tư dòng tiền (giai đoạn 3 của pipeline 4 giai đoạn,
 * docs/research/investment-pipeline-4-stages.md).
 * Defaults dẫn xuất từ dữ liệu thật của chính hệ thống:
 *   giá bán/m² + thuê LTR = vải công khai P2 (S06 Chợ Tốt, phường market)
 *   ADR + công suất = listing Airbnb TỰ THU (listing_stats, 90 đêm đầu —
 *   cùng mô hình với /yield). AirDNA chỉ để hiệu chuẩn ở /ops/quality
 *   (AGENTS.md luật 5) — không cấp số mặc định cho Invest.
 * Người dùng chỉnh mọi thông số — máy tính chạy client-side.
 */
export type InvestmentDefaults = {
  marketId: string;
  marketName: string;
  salePerm2: number | null; // VND/m² — median P2
  saleN: number;
  rentLt: number | null; // VND/tháng — median P2 rent
  rentN: number;
  adr: number | null; // VND/đêm — median giá niêm yết listing tự thu
  occupancy: number | null; // % — median công suất 90 đêm đầu, listing tự thu
  strN: number; // số listing tự thu dựng ADR/công suất
};

export async function getInvestmentDefaults(areaId: string): Promise<InvestmentDefaults | null> {
  const { rows: area } = await pool.query(
    `SELECT id, name FROM areas WHERE id = $1 AND region_type = 'market'`,
    [areaId],
  );
  if (area.length === 0) return null;

  const { rows: phuong } = await pool.query(
    `SELECT id FROM areas WHERE parent_id = $1 AND region_type = 'submarket'`,
    [areaId],
  );
  const ids = [areaId, ...phuong.map((p: { id: string }) => p.id)];

  // vải P2: bán + thuê (S06) — n của market = tổng offers dùng tính median
  // G-2: median bán theo CĂN (v_ruler_p2_area dedup repost — 'Một Căn Nhà')
  const { rows: sale } = await pool.query(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY m_per_prop) m, sum(n)::int n
     FROM (
       SELECT v.area_id, percentile_cont(0.5) WITHIN GROUP (ORDER BY o.price_perm2) AS m_per_prop, count(*)::int n
       FROM v_ruler_p2_area v
       JOIN properties pr ON pr.area_id = v.area_id AND pr.kind='sale'
       JOIN property_offers po ON po.property_id = pr.id
       JOIN sale_offers o ON o.offer_id = po.offer_id
         AND o.last_seen = (SELECT max(o2.last_seen) FROM sale_offers o2
                            JOIN property_offers po2 ON po2.offer_id = o2.offer_id
                            WHERE po2.property_id = pr.id)
       WHERE v.area_id = ANY($1::text[]) AND o.price_perm2 BETWEEN 5e6 AND 500e6
       GROUP BY v.area_id, v.n
     ) x`,
    [ids],
  );
  const { rows: rent } = await pool.query(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY price_vnd) m, count(*) n
     FROM sale_offers
     WHERE source='S06' AND kind='rent_lt' AND price_vnd BETWEEN 1e6 AND 200e6
       AND area_id = ANY($1::text[])`,
    [ids],
  );

  // STR tự thu: lịch tương lai thưa dần về cuối nên công suất lấy 90 đêm đầu
  // (nights90/booked90 tính sẵn ở pipeline/sql/410_listing_stats.sql).
  const { rows: str } = await pool.query(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY l.price_listed) AS adr,
            percentile_cont(0.5) WITHIN GROUP (ORDER BY p.booked90::numeric / p.nights90) AS occ,
            count(*)::int AS n
     FROM listings l
     JOIN areas a ON a.id = l.area_id
     JOIN listing_stats p ON p.listing_id = l.id
     WHERE (a.id = $1 OR a.parent_id = $1) AND l.price_listed > 0 AND p.nights90 > 0`,
    [areaId],
  );
  const strN = Number(str[0]?.n ?? 0);

  return {
    marketId: areaId,
    marketName: area[0].name,
    salePerm2: sale[0]?.m ? Math.round(Number(sale[0].m)) : null,
    saleN: Number(sale[0]?.n ?? 0),
    rentLt: rent[0]?.m ? Math.round(Number(rent[0].m)) : null,
    rentN: Number(rent[0]?.n ?? 0),
    adr: strN > 0 && str[0].adr !== null ? Math.round(Number(str[0].adr)) : null,
    occupancy: strN > 0 && str[0].occ !== null ? Math.round(Number(str[0].occ) * 100) : null,
    strN,
  };
}
