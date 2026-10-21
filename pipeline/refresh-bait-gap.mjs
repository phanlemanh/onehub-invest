// refresh-bait-gap.mjs — P4: thước P2 + bait_gap_pct + broker scoring.
//
// Kiến trúc "vải công khai + tín hiệu riêng + khoá SĐT"
// (docs/research/investment-pipeline-4-stages.md):
//   RULER   = median price/m² theo phường, tính từ vải Chợ Tốt S06
//            (kind='sale', perm2 5tr–500tr chống dữ liệu rác, n≥5/phường).
//   GAP     = bait_gap_pct trên offer P1 (S03/S05): % dưới thước công khai
//            của cùng phường — dương = tin nội bộ rẻ hơn rao công khai.
//   SELLERS = registry DẪN XUẤT: script này là CHỦ DUY NHẤT của các cột
//            tổng hợp (n_ads, sources, first/last_seen, flags) — transform
//            chỉ ghi offers; tránh bug n_ads cộng dồn mỗi lần transform
//            chạy lại.
import { pathToFileURL } from "node:url";
import pg from "pg";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    // ---- 1. Ruler: median perm2 theo phường từ vải S06 ----
    const ruler = await c.query(`
      SELECT area_id,
             percentile_cont(0.5) WITHIN GROUP (ORDER BY price_perm2) AS m,
             count(*) AS n
      FROM sale_offers
      WHERE source = 'S06' AND kind = 'sale'
        AND price_perm2 BETWEEN 5e6 AND 500e6 AND area_id IS NOT NULL
      GROUP BY 1 HAVING count(*) >= 5`);
    console.log(`ruler: ${ruler.rows.length} phường (S06 n≥5, max n=${Math.max(0, ...ruler.rows.map((r) => Number(r.n)))})`);

    // ---- 2. bait_gap_pct trên offers P1 ----
    await c.query(`UPDATE sale_offers SET bait_gap_pct = NULL WHERE price_tier = 'P1'`);
    const gap = await c.query(`
      WITH r AS (
        SELECT area_id, percentile_cont(0.5) WITHIN GROUP (ORDER BY price_perm2) AS m
        FROM sale_offers
        WHERE source = 'S06' AND kind = 'sale'
          AND price_perm2 BETWEEN 5e6 AND 500e6 AND area_id IS NOT NULL
        GROUP BY 1 HAVING count(*) >= 5
      )
      UPDATE sale_offers o
      SET bait_gap_pct = ROUND((1 - o.price_perm2::numeric / r.m::numeric) * 100, 1)
      FROM r
      WHERE r.area_id = o.area_id
        AND o.price_tier = 'P1' AND o.kind = 'sale' AND o.price_perm2 > 0`);
    console.log(`bait_gap_pct: cập nhật ${gap.rowCount} offers P1`);

    // ---- 3. Sellers registry — tổng hợp lại toàn bộ từ offers (chân lý) ----
    const agg = await c.query(`
      WITH s AS (
        SELECT seller_phone_hash h,
               count(*) n_ads,
               min(first_seen) fs, max(last_seen) ls,
               max(seller_name) best_name,
               array_agg(DISTINCT source) srcs,
               count(*) FILTER (WHERE kind = 'sale') n_sale,
               count(*) FILTER (WHERE kind = 'rent_lt') n_rent,
               percentile_cont(0.5) WITHIN GROUP (ORDER BY bait_gap_pct) FILTER (WHERE bait_gap_pct IS NOT NULL) med_gap,
               count(*) FILTER (WHERE bait_gap_pct >= 10) n_good
        FROM sale_offers
        WHERE seller_phone_hash IS NOT NULL
        GROUP BY 1
      )
      UPDATE sellers x
      SET n_ads = s.n_ads, sources = s.srcs, first_seen = s.fs, last_seen = s.ls,
          name = COALESCE(x.name, s.best_name),
          flags = jsonb_build_object(
            'n_sale', s.n_sale, 'n_rent', s.n_rent,
            'median_gap_pct', s.med_gap, 'n_good_deals', s.n_good,
            'multi_channel', cardinality(s.srcs) > 1,
            'sources', to_jsonb(s.srcs))
      FROM s WHERE x.phone_hash = s.h`);
    console.log(`sellers: cập nhật ${agg.rowCount} người bán`);

    const top = await c.query(`
      SELECT name, n_ads, flags->>'median_gap_pct' med, flags->>'multi_channel' multi
      FROM sellers WHERE flags->>'median_gap_pct' IS NOT NULL
      ORDER BY (flags->>'median_gap_pct')::numeric DESC LIMIT 3`);
    for (const r of top.rows) {
      console.log(`  broker: ${r.name ?? "?"} — ${r.n_ads} tin, gap giữa ${r.med}%, đa kênh=${r.multi}`);
    }
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
