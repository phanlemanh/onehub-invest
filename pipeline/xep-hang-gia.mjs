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
import { PROPERTY_TYPE } from "./lib/vocab.generated.mjs";

const DB_URL =
  process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Câu chấm chỉ cấp phường (420, CG9) — đọc theo vị trí tệp này. Chạy khi DB chưa có view offer_project (105). */
export const SQL_420 = readFileSync(new URL("./sql/420_price_rank.sql", import.meta.url), "utf8");
/** Câu chấm có cấp dự án (422, CG10) — chạy khi DB có view offer_project. */
export const SQL_420_DU_AN = readFileSync(new URL("./sql/422_price_rank_du_an.sql", import.meta.url), "utf8");
/** Dải m² dự án × PN (421, CG10) — chạy khi DB có cả view offer_project lẫn bảng project_area_band (106). */
export const SQL_421 = readFileSync(new URL("./sql/421_project_area_band.sql", import.meta.url), "utf8");
/** Mặt bằng S03 so S06 mỗi nhóm cấp dự án (423, CG15) — chạy sau 422 khi DB có view offer_project và bảng 107. */
export const SQL_423 = readFileSync(new URL("./sql/423_project_source_baseline.sql", import.meta.url), "utf8");

/** Khoá advisory riêng của bước chấm — hai job đêm chạy chồng thì xếp hàng. */
export const KHOA_XEP_HANG = "SELECT pg_advisory_xact_lock(hashtext('xep-hang-gia'))";

/** Loại hình mà diện tích ghi trên tin là diện tích sàn của chính căn — luật «phòng quá nhỏ» chỉ đúng nghĩa ở đây. */
export const LOAI_DIEN_TICH_SAN = new Set([PROPERTY_TYPE.apartment, PROPERTY_TYPE.room]);

/**
 * Lý do phi lý ON11 của một tin cho bước chấm. Tin không có diện tích không bị coi là phi lý ở đây: tin thuê thiếu m² được so
 * theo giá tháng cùng số phòng ngủ (QĐ4), tin bán thiếu m² rơi vào «thieu-gia» ở 420. Chỉ còn luật số phòng ngủ ngoài khoảng.
 * «Phòng quá nhỏ» (diện tích chia số phòng ngủ dưới 20 m²) chỉ áp cho căn hộ và phòng: nhà phố ghi diện tích đất, nhà nhiều
 * tầng nên chia cho số phòng là phép đo sai (đo 14/11 trên bản chép máy thu: 18.709 tin nhà S06 bị loại oan; ON11 viết khi tin
 * S03 chưa có loại hình — giới hạn đã ghi ở lib/deal-plausibility.mjs).
 * @param {{ area_m2: unknown, bedrooms: unknown, property_type?: string | null }} r
 * @returns {string | null}
 */
export function lyDoPhiLy(r) {
  const area = r.area_m2 == null ? null : Number(r.area_m2);
  if (area !== null && Number.isFinite(area) && area > 0) {
    const ly = implausibleReason({ areaM2: area, bedrooms: r.bedrooms });
    return ly === "phong-qua-nho" && !LOAI_DIEN_TICH_SAN.has(r.property_type ?? "") ? null : ly;
  }
  const beds = r.bedrooms == null ? null : Number(r.bedrooms);
  return beds !== null && Number.isFinite(beds) && beds > PLAUSIBILITY.maxBedrooms ? "phong-ngu-ngoai-khoang" : null;
}

/**
 * Chấm lại toàn bộ bảng. Tự mở giao dịch khi `c` chưa ở giao dịch; `savepoint: true` khi người gọi đã mở (test).
 * `sauXoa` chỉ cho ca đột biến của phép đo (ném lỗi sau khi xoá để chứng bảng cũ còn nguyên).
 * CG10: dò view `offer_project` (105) và bảng `project_area_band` (106) theo search_path — không ghi `public.` (bài học #456):
 * có view thì chấm bằng 422 (cấp dự án), không thì 420 (chỉ phường) và in một dòng; có 106 thì xoá trọn rồi ghi dải m² (421)
 * trong cùng giao dịch, chưa áp 106 thì in một dòng và bỏ dải. `tenView`, `boDo106` chỉ cho ca đột biến của phép đo.
 * CG15: có bảng project_source_baseline (107) thì xoá trọn rồi ghi mặt bằng S03/S06 (423, `sql423` cho ca đột biến) sau 422;
 * chưa áp 107 thì in một dòng và bỏ. `boDo107` chỉ cho ca đột biến (ghi mà không dò bảng).
 * @param {import("pg").Client} c
 * @param {{ runId?: string, savepoint?: boolean, sql?: string, sauXoa?: () => Promise<void>, log?: (s: string) => void,
 *   tenView?: string, boDo106?: boolean, sql423?: string, boDo107?: boolean }} [opts]
 * @returns {Promise<{ chuaAp104: boolean, runId: string | null, tong: number, capDuAn: boolean, dai: number | null,
 *   matBang: number | null,
 *   theoKind: Record<string, { nhan: number, chiSo: number, khongCham: Record<string, number> }> }>}
 */
export async function xepHangGia(c, { runId = `xhg-${randomUUID()}`, savepoint = false, sql, sauXoa, log = console.log,
  tenView = "offer_project", boDo106 = false, sql423, boDo107 = false } = {}) {
  if (!(await c.query("SELECT to_regclass('offer_price_rank') AS t")).rows[0].t) {
    log("xep-hang-gia: chưa áp 104 — bỏ qua, không ghi");
    return { chuaAp104: true, runId: null, tong: 0, capDuAn: false, dai: null, matBang: null, theoKind: {} };
  }
  const coView = Boolean((await c.query("SELECT to_regclass($1) AS t", [tenView])).rows[0].t);
  const co106 = boDo106 || Boolean((await c.query("SELECT to_regclass('project_area_band') AS t")).rows[0].t);
  if (!coView) log("xep-hang-gia: chưa có offer_project — chỉ chấm cấp phường");
  else if (!co106) log("xep-hang-gia: chưa áp 106 — bỏ dải diện tích");
  const co107 = boDo107 || Boolean((await c.query("SELECT to_regclass('project_source_baseline') AS t")).rows[0].t);
  if (!co107) log("xep-hang-gia: chưa áp 107 — bỏ mặt bằng hai nguồn");
  const cau = sql ?? (coView ? SQL_420_DU_AN : SQL_420);
  const [mo, xong, lui] = savepoint
    ? ["SAVEPOINT xep_hang_gia", "RELEASE SAVEPOINT xep_hang_gia", "ROLLBACK TO SAVEPOINT xep_hang_gia"]
    : ["BEGIN", "COMMIT", "ROLLBACK"];
  await c.query(mo);
  try {
    await c.query(KHOA_XEP_HANG);
    // Câu 420 gom 100 nghìn tin qua nhiều CTE; ước lượng dòng trên CTE kém nên bộ lập kế hoạch dễ chọn vòng lặp lồng (đo 14/11
    // trên bản chép chưa ANALYZE: 50 phút/lượt; tắt vòng lặp lồng: 3,5 giây). Chỉ trong giao dịch của bước chấm.
    await c.query("SELECT set_config('enable_nestloop', 'off', true)");
    const tin = await c.query(`SELECT offer_id, area_m2, bedrooms, property_type FROM sale_offers`);
    const phiLy = [];
    for (const r of tin.rows) {
      const ly = lyDoPhiLy(r);
      if (ly) phiLy.push({ offer_id: r.offer_id, ly_do: ly });
    }
    await c.query(`DELETE FROM offer_price_rank`);
    if (co106) await c.query(`DELETE FROM project_area_band`);
    if (co107) await c.query(`DELETE FROM project_source_baseline`);
    if (sauXoa) await sauXoa();
    await c.query(cau, [runId, JSON.stringify(phiLy)]);
    let dai = null;
    if (co106 && coView) dai = (await c.query(SQL_421, [runId, JSON.stringify(phiLy)])).rowCount;
    let matBang = null;
    if (co107) matBang = coView ? (await c.query(sql423 ?? SQL_423, [runId])).rowCount : 0;
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
    log(`xep-hang-gia: ${tong} tin (run ${runId})${dai === null ? "" : ` · dải m² ${dai} nhóm`}${matBang === null ? "" : ` · mặt bằng hai nguồn ${matBang} nhóm`}`);
    for (const [k, v] of Object.entries(theoKind)) {
      log(`  ${k}: có nhãn ${v.nhan} · chỉ số ${v.chiSo} · không chấm ${JSON.stringify(v.khongCham)}`);
    }
    return { chuaAp104: false, runId, tong, capDuAn: coView, dai, matBang, theoKind };
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
