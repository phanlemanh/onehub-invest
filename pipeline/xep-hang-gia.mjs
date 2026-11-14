// xep-hang-gia.mjs — CG9 bang-hang-gia-m2: chấm hạng giá mọi tin đang rao vào offer_price_rank (migration 104).
// docs/superpowers/specs/2026-11-14-bang-hang-gia-m2-design.md §2.2. Luật nằm ở sql/420_price_rank.sql; tệp này lo giao dịch,
// khoá, luật phi lý ON11 (lib/deal-plausibility.mjs) và báo cáo. Ba job đêm gọi bằng job_run sau bước định vị (AC-11).
// Một giao dịch: xoá trọn rồi chèn — lỗi giữa chừng thì bảng cũ còn nguyên, người đọc không thấy bảng rỗng.
// DB chưa áp 104 → in «chưa áp 104», không ghi, thoát 0.
import { randomUUID } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { PLAUSIBILITY, implausibleReason } from "./lib/deal-plausibility.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Câu chấm (420) — đọc theo vị trí tệp này. */
export const SQL_420 = readFileSync(new URL("./sql/420_price_rank.sql", import.meta.url), "utf8");

/** Khoá advisory riêng của bước chấm — hai job đêm chạy chồng thì xếp hàng. */
export const KHOA_XEP_HANG = "SELECT pg_advisory_xact_lock(hashtext('xep-hang-gia'))";

/**
 * Lý do phi lý ON11 của một tin cho bước chấm. Tin không có diện tích không bị coi là phi lý ở đây: tin thuê thiếu m² được so
 * theo giá tháng cùng số phòng ngủ (QĐ4), tin bán thiếu m² rơi vào «thieu-gia» ở 420. Chỉ còn luật số phòng ngủ ngoài khoảng.
 * @param {{ area_m2: unknown, bedrooms: unknown }} r
 * @returns {string | null}
 */
export function lyDoPhiLy(r) {
  const area = r.area_m2 == null ? null : Number(r.area_m2);
  if (area !== null && Number.isFinite(area) && area > 0) return implausibleReason({ areaM2: area, bedrooms: r.bedrooms });
  const beds = r.bedrooms == null ? null : Number(r.bedrooms);
  return beds !== null && Number.isFinite(beds) && beds > PLAUSIBILITY.maxBedrooms ? "phong-ngu-ngoai-khoang" : null;
}

/**
 * Chấm lại toàn bộ bảng. Tự mở giao dịch khi `c` chưa ở giao dịch; `savepoint: true` khi người gọi đã mở (test).
 * `sauXoa` chỉ cho ca đột biến của phép đo (ném lỗi sau khi xoá để chứng bảng cũ còn nguyên).
 * @param {import("pg").Client} c
 * @param {{ runId?: string, savepoint?: boolean, sql?: string, sauXoa?: () => Promise<void>, log?: (s: string) => void }} [opts]
 * @returns {Promise<{ chuaAp104: boolean, runId: string | null, tong: number,
 *   theoKind: Record<string, { nhan: number, chiSo: number, khongCham: Record<string, number> }> }>}
 */
export async function xepHangGia(c, { runId = `xhg-${randomUUID()}`, savepoint = false, sql = SQL_420, sauXoa, log = console.log } = {}) {
  if (!(await c.query("SELECT to_regclass('public.offer_price_rank') AS t")).rows[0].t) {
    log("xep-hang-gia: chưa áp 104 — bỏ qua, không ghi");
    return { chuaAp104: true, runId: null, tong: 0, theoKind: {} };
  }
  const [mo, xong, lui] = savepoint
    ? ["SAVEPOINT xep_hang_gia", "RELEASE SAVEPOINT xep_hang_gia", "ROLLBACK TO SAVEPOINT xep_hang_gia"]
    : ["BEGIN", "COMMIT", "ROLLBACK"];
  await c.query(mo);
  try {
    await c.query(KHOA_XEP_HANG);
    const tin = await c.query(`SELECT offer_id, area_m2, bedrooms FROM sale_offers`);
    const phiLy = [];
    for (const r of tin.rows) {
      const ly = lyDoPhiLy(r);
      if (ly) phiLy.push({ offer_id: r.offer_id, ly_do: ly });
    }
    await c.query(`DELETE FROM offer_price_rank`);
    if (sauXoa) await sauXoa();
    await c.query(sql, [runId, JSON.stringify(phiLy)]);
    const dem = await c.query(`
      SELECT kind,
             count(*) FILTER (WHERE nhan IS NOT NULL)::int AS nhan,
             count(*) FILTER (WHERE nhan IS NULL AND hang_pct IS NOT NULL)::int AS chi_so,
             coalesce(jsonb_object_agg(ld, so) FILTER (WHERE ld IS NOT NULL), '{}'::jsonb) AS khong_cham
        FROM (SELECT kind, nhan, hang_pct, NULL::text AS ld, NULL::int AS so FROM offer_price_rank
              UNION ALL
              SELECT kind, NULL, NULL, split_part(ly_do, ':', 1), count(*)::int FROM offer_price_rank
               WHERE hang_pct IS NULL GROUP BY kind, split_part(ly_do, ':', 1)) x
       GROUP BY kind ORDER BY kind`);
    await c.query(xong);
    const theoKind = {};
    let tong = 0;
    for (const r of dem.rows) {
      theoKind[r.kind] = { nhan: r.nhan, chiSo: r.chi_so, khongCham: r.khong_cham };
      tong += r.nhan + r.chi_so + Object.values(r.khong_cham).reduce((a, b) => a + Number(b), 0);
    }
    log(`xep-hang-gia: ${tong} tin (run ${runId})`);
    for (const [k, v] of Object.entries(theoKind)) {
      log(`  ${k}: có nhãn ${v.nhan} · chỉ số ${v.chiSo} · không chấm ${JSON.stringify(v.khongCham)}`);
    }
    return { chuaAp104: false, runId, tong, theoKind };
  } catch (e) {
    await c.query(lui).catch(() => {});
    throw e;
  }
}

async function main() {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await xepHangGia(c);
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e); process.exit(1); });
