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
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { dungNguoi } from "./lib/danh-ba-nguoi.mjs";
import { implausibleReason } from "./lib/deal-plausibility.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/**
 * Thân bước bait gap + sellers — chạy được trong transaction của người gọi (thước dư lượng, test).
 * @param {import("pg").Client} c
 */
export async function refreshBaitGap(c) {
  // ---- 1. Ruler: median perm2 theo phường từ vải S06 ----
  const ruler = await c.query(`
    SELECT area_id, m, n FROM v_ruler_p2_area`);
  console.log(`ruler: ${ruler.rows.length} phường (S06 n≥5, max n=${Math.max(0, ...ruler.rows.map((r) => Number(r.n)))})`);

  // ---- 2. bait_gap_pct trên offers P1 ----
  await c.query(`UPDATE sale_offers SET bait_gap_pct = NULL WHERE price_tier = 'P1'`);
  const gap = await c.query(`
    WITH r AS (SELECT area_id, m FROM v_ruler_p2_area)
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

  // ---- 4. Người bán không còn tin nào (vd chỉ đăng trong tin thử đã rút — PL2) ----
  // Registry dẫn xuất từ offers: không còn offer thì không còn chỗ đứng. Ghi audit số đã xoá
  // + số còn lại — sync-cloud đọc dòng này để biết bảng co lại vì dọn, không phải local dựng dở.
  const orphan = await c.query(`
    DELETE FROM sellers x
    WHERE NOT EXISTS (SELECT 1 FROM sale_offers o WHERE o.seller_phone_hash = x.phone_hash)`);
  const remaining = Number((await c.query(`SELECT count(*) AS n FROM sellers`)).rows[0].n);
  if (orphan.rowCount > 0) {
    await c.query(
      `INSERT INTO ops_audit (actor, action, env, detail)
       VALUES ('refresh-bait-gap', 'bait-gap:sellers-orphan', 'local', $1)`,
      [{ deleted: orphan.rowCount, remaining }],
    );
  }
  console.log(`sellers: xoá ${orphan.rowCount} người bán không còn tin, còn ${remaining}`);

  // ---- 5. Loại tin phi lý khỏi Căn giá tốt (ON11) — SAU bước người bán: registry giữ tín hiệu rao mồi ----
  const cand = await c.query(`
    SELECT offer_id, area_m2, bedrooms FROM sale_offers
    WHERE price_tier = 'P1' AND kind = 'sale' AND bait_gap_pct IS NOT NULL`);
  const loai = await loaiTinPhiLy(c, cand.rows);
  console.log(`loại tin phi lý: ${loai.total} tin ${JSON.stringify(loai.by_reason)}`);

  const top = await c.query(`
    SELECT name, n_ads, flags->>'median_gap_pct' med, flags->>'multi_channel' multi
    FROM sellers WHERE flags->>'median_gap_pct' IS NOT NULL
    ORDER BY (flags->>'median_gap_pct')::numeric DESC LIMIT 3`);
  for (const r of top.rows) {
    console.log(`  broker: ${r.name ?? "?"} — ${r.n_ads} tin, gap giữa ${r.med}%, đa kênh=${r.multi}`);
  }
  return {
    gap: gap.rowCount,
    sellersUpdated: agg.rowCount,
    sellersDeleted: orphan.rowCount,
    sellersRemaining: remaining,
    loaiPhiLy: loai.total,
  };
}

/**
 * Chấm từng tin bằng implausibleReason; tin trượt mất bait_gap_pct (không còn là căn giá tốt) và cả lượt ghi
 * MỘT dòng ops_audit nêu lý do. Không tin nào trượt thì không ghi gì.
 * @param {import("pg").Client} c
 * @param {{ offer_id: string, area_m2: unknown, bedrooms: unknown }[]} rows
 * @returns {Promise<{ total: number, by_reason: Record<string, number>, offer_ids: string[] }>}
 */
export async function loaiTinPhiLy(c, rows) {
  const by_reason = {};
  const offer_ids = [];
  for (const r of rows) {
    const why = implausibleReason({ areaM2: r.area_m2, bedrooms: r.bedrooms });
    if (!why) continue;
    by_reason[why] = (by_reason[why] ?? 0) + 1;
    offer_ids.push(r.offer_id);
  }
  if (offer_ids.length === 0) return { total: 0, by_reason, offer_ids };
  await c.query(`UPDATE sale_offers SET bait_gap_pct = NULL WHERE offer_id = ANY($1::text[])`, [offer_ids]);
  const detail = { total: offer_ids.length, by_reason, offer_ids };
  await c.query(
    `INSERT INTO ops_audit (actor, action, env, detail) VALUES ('refresh-bait-gap', 'bait-gap:loai-phi-ly', 'local', $1)`,
    [detail],
  );
  return detail;
}

/**
 * Bước đêm: bait gap + sellers (tự-commit như trước), rồi danh bạ Người (DB2b) trong giao dịch RIÊNG — bộ dựng lỗi
 * không kéo lùi bait gap/sellers, và lỗi được ném lại (không nuốt). `savepoint: true` khi người gọi đã mở giao dịch
 * (test, thước nạp lại). DB chưa áp 055 (chưa có bảng parties) → bỏ qua bộ dựng, in một dòng.
 * @param {import("pg").Client} c
 */
export async function buocDem(c, { savepoint = false, runId } = {}) {
  const kq = await refreshBaitGap(c);
  if (!(await c.query("SELECT to_regclass('public.parties') AS t")).rows[0].t) {
    console.log("danh-ba-nguoi: bỏ qua — DB chưa áp 055 (chưa có bảng parties)");
    return { ...kq, nguoi: null };
  }
  const [mo, xong, lui] = savepoint
    ? ["SAVEPOINT dung_nguoi", "RELEASE SAVEPOINT dung_nguoi", "ROLLBACK TO SAVEPOINT dung_nguoi"]
    : ["BEGIN", "COMMIT", "ROLLBACK"];
  await c.query(mo);
  try {
    const nguoi = await dungNguoi(c, { runId });
    await c.query(xong);
    return { ...kq, nguoi };
  } catch (e) {
    await c.query(lui);
    throw e;
  }
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await buocDem(c);
  } finally {
    await c.end();
  }
}

const isMain =
  process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
