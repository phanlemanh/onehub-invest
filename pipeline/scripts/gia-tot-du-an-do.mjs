// gia-tot-du-an-do.mjs — hồ sơ gia-tot-cap-du-an (CG10), AC-9: đo bảng hạng giá có CẤP DỰ ÁN trên DB thử chép từ DB máy thu
// (gia-tot-du-an-db.sh do). Áp 104 nếu chưa có, view offer_project (105 của cây, hay bản chép) nếu DB chưa có, 106; chạy bước chấm
// hai lần; rồi đếm độc lập bằng SQL viết riêng (không dùng 420/422):
//   · lech = số tin có n hay trung vị khác nhóm dựng lại — cấp phường bằng SQL_DO của CG9, cấp dự án bằng SQL_DO_DU_AN ở tệp này
//     (thành viên dự án đọc thẳng offer_project, phiếu dựng lại từ sale_offers + property_offers);
//   · sai_khoa = tin so với nhóm khác loại / khác bán-thuê (CG9) + tin cấp dự án mà nút khác dự án của chính tin;
//   · nhan_nhom_duoi_10; lần hai giống lần một (bảng hạng và dải m²);
//   · can_ho_cap_du_an = tin căn hộ có hạng cấp dự án (thước MN1, ngưỡng ≥ 10.000);
//   · op1_danh_sach_can = số dòng (căn) của danh sách /ops/deals lọc Ocean Park 1 (nút 1) — chạy CHÍNH câu dealsSql({coBang, duAn})
//     của app (lấy qua tsx), giới hạn SO_CAN_DU_AN; in kèm số tin. Ngưỡng ≥ 100.
// In bảng đếm cấp × kind × thước × ô và mẫu số; thoát 1 nêu điều kiện hỏng. DB phải là DB thử oneinvest_<…> (thoát 2).
// Đối chứng (thoát 0 khi đỏ đúng): --doi-chung-khoa «nhóm theo phường thay dự án» → sai_khoa > 0; --doi-chung-hong «mỗi tin một
// phiếu» → lech > 0.
import { execFileSync } from "node:child_process";
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { SQL_420_DU_AN, xepHangGia } from "../xep-hang-gia.mjs";
import { SQL_DO } from "./hang-gia-do.mjs";
import { sqlView105 } from "./gia-tot-du-an-fixture.itest.mjs";

const MIG_104 = new URL("../../db/migrations/104_offer_price_rank.sql", import.meta.url);
const MIG_106 = new URL("../../db/migrations/106_project_area_band.sql", import.meta.url);
const APP = fileURLToPath(new URL("../../app/", import.meta.url));
const DOT_HONG = [
  "coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = t.offer_id),\n                  'o:' || t.offer_id) AS phieu",
  "'o:' || t.offer_id AS phieu"];
const DOT_KHOA = ["CASE WHEN op.status = 'mot_du_an' THEN op.project_node_id END AS pj",
  "CASE WHEN op.status = 'mot_du_an' THEN abs(hashtext(o.area_id))::bigint END AS pj"];
const CHAM = `(r.ly_do IS NULL OR r.ly_do IN ('nhom-5-9', 'nhom-duoi-5', 'pn-duoi-10'))`;

/** Đếm độc lập nhóm cấp dự án: dựng lại phiếu của mỗi khoá (thuoc, nút dự án, loại, kind, pn_nhom) có trong bảng. */
export const SQL_DO_DU_AN = `
WITH tin AS (
  SELECT o.offer_id, o.kind, o.property_type, o.bedrooms, o.last_seen, o.price_perm2, o.price_vnd, op.project_node_id::text AS pj,
         coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id), 'o:' || o.offer_id) AS phieu
    FROM sale_offers o JOIN offer_project op ON op.offer_id = o.offer_id AND op.status = 'mot_du_an'
), hop_le AS (
  SELECT t.*, r.thuoc FROM tin t JOIN offer_price_rank r ON r.offer_id = t.offer_id WHERE ${CHAM}
), khoa AS (
  SELECT DISTINCT r.thuoc, r.nut, r.property_type, r.kind, r.pn_nhom FROM offer_price_rank r WHERE r.cap = 'du_an' AND ${CHAM}
), thanh_vien AS (
  SELECT k.thuoc, k.nut, k.property_type, k.kind, k.pn_nhom, h.phieu, h.last_seen, h.offer_id, h.bedrooms,
         CASE k.thuoc WHEN 'gia-m2' THEN h.price_perm2::numeric ELSE h.price_vnd::numeric END AS v
    FROM khoa k
    JOIN tin h ON h.pj = k.nut AND h.property_type = k.property_type AND (k.thuoc = 'gia-thang-pn' OR h.kind = k.kind)
   WHERE (k.thuoc = 'gia-m2' AND EXISTS (SELECT 1 FROM hop_le x WHERE x.offer_id = h.offer_id AND x.thuoc = 'gia-m2'))
      OR (k.thuoc = 'gia-thang-pn' AND h.kind = 'rent_lt' AND h.bedrooms = k.pn_nhom
          AND h.price_vnd BETWEEN 1000000 AND 500000000
          AND EXISTS (SELECT 1 FROM hop_le x WHERE x.offer_id = h.offer_id))
), phieu AS (
  SELECT * FROM (
    SELECT DISTINCT ON (thuoc, nut, property_type, kind, pn_nhom, phieu) *
      FROM thanh_vien ORDER BY thuoc, nut, property_type, kind, pn_nhom, phieu, last_seen DESC NULLS LAST, offer_id) d
   WHERE thuoc = 'gia-thang-pn' OR pn_nhom IS NULL OR bedrooms = pn_nhom
), st AS (
  SELECT thuoc, nut, property_type, kind, pn_nhom, count(*)::int AS n, percentile_cont(0.5) WITHIN GROUP (ORDER BY v) AS tv
    FROM phieu GROUP BY 1, 2, 3, 4, 5
)
SELECT
  (SELECT count(*) FROM offer_price_rank r JOIN st USING (thuoc, nut, property_type, kind)
    WHERE r.cap = 'du_an' AND ${CHAM} AND r.pn_nhom IS NOT DISTINCT FROM st.pn_nhom
      AND (r.n IS DISTINCT FROM st.n OR (r.trung_vi IS NOT NULL AND abs(r.trung_vi - st.tv) > 0.5)))::int AS lech,
  (SELECT count(*) FROM offer_price_rank r WHERE r.cap = 'du_an' AND ${CHAM}
      AND NOT EXISTS (SELECT 1 FROM st WHERE st.thuoc = r.thuoc AND st.nut = r.nut AND st.property_type = r.property_type
                       AND st.kind = r.kind AND st.pn_nhom IS NOT DISTINCT FROM r.pn_nhom))::int AS khong_dung_lai,
  (SELECT count(*) FROM offer_price_rank r LEFT JOIN offer_project op ON op.offer_id = r.offer_id AND op.status = 'mot_du_an'
    WHERE r.cap = 'du_an' AND r.nut IS DISTINCT FROM op.project_node_id::text)::int AS sai_khoa`;

const BANG_DEM = `
SELECT coalesce(cap, '-') AS cap, kind, coalesce(thuoc, '-') AS thuoc,
       CASE WHEN nhan IS NOT NULL THEN 'nhan:' || nhan WHEN hang_pct IS NOT NULL THEN 'chi-so' ELSE 'khong-cham:' || split_part(ly_do, ':', 1) END AS o,
       count(*)::int AS n
  FROM offer_price_rank GROUP BY 1, 2, 3, 4 ORDER BY 1, 2, 3, 4`;
const ANH = `SELECT md5(coalesce(string_agg(row(offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, pn_nhom, n, trung_vi,
  p20, hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do)::text, '|' ORDER BY offer_id), '')) ||
  (SELECT md5(coalesce(string_agg(row(project_node_id, bedrooms, p10, p50, p90, n)::text, '|' ORDER BY project_node_id, bedrooms), ''))
     FROM project_area_band) AS h FROM offer_price_rank`;

/** Chính câu danh sách lọc dự án của app (deals.ts) — lấy chữ câu qua tsx, không chép tay. */
function cauDanhSachDuAn() {
  return execFileSync(process.execPath, ["--import", "tsx", "-e",
    'import("./src/lib/deals.ts").then((m) => process.stdout.write(JSON.stringify({ sql: m.dealsSql({ coBang: true, duAn: true }), lim: m.SO_CAN_DU_AN })))'],
  { cwd: APP, encoding: "utf8", env: { ...process.env } });
}

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const ten = url.split("?")[0].split("/").pop();
  if (!/^oneinvest_[a-z0-9_]+$/.test(ten ?? "")) {
    console.error(`gia-tot-du-an-do: chỉ chạy trên DB thử oneinvest_<…>, không phải «${ten}»`);
    return 2;
  }
  const hong = process.argv.includes("--doi-chung-hong");
  const khoa = process.argv.includes("--doi-chung-khoa");
  const ds = JSON.parse(cauDanhSachDuAn());
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(readFileSync(MIG_104, "utf8"));
    if (!(await c.query(`SELECT to_regclass('offer_project') AS t`)).rows[0].t) await c.query(sqlView105());
    await c.query(readFileSync(MIG_106, "utf8"));
    const dot = hong ? DOT_HONG : khoa ? DOT_KHOA : null;
    const sql = dot ? SQL_420_DU_AN.split(dot[0]).join(dot[1]) : SQL_420_DU_AN;
    if (dot && sql === SQL_420_DU_AN) throw new Error("đột biến rỗng — không thấy chuỗi cần thay trong 422");
    const t0 = Date.now();
    await xepHangGia(c, { sql, log: () => {} });
    const giay1 = (Date.now() - t0) / 1000;
    const anh1 = (await c.query(ANH)).rows[0].h;
    await xepHangGia(c, { sql, log: () => {} });
    const anh2 = (await c.query(ANH)).rows[0].h;
    await c.query("SELECT set_config('enable_nestloop', 'off', false)");
    const p = (await c.query(SQL_DO)).rows[0];
    const d = (await c.query(SQL_DO_DU_AN)).rows[0];
    const bang = (await c.query(BANG_DEM)).rows;
    const mauSo = (await c.query(`SELECT kind, count(*)::int AS n FROM sale_offers GROUP BY 1 ORDER BY 1`)).rows;
    const canHo = (await c.query(`SELECT count(*)::int AS n FROM offer_price_rank WHERE cap = 'du_an' AND property_type = 'apartment' AND hang_pct IS NOT NULL`)).rows[0].n;
    const dai = (await c.query(`SELECT count(*)::int AS n, coalesce(sum(n), 0)::int AS mau FROM project_area_band`)).rows[0];
    const op1 = (await c.query(`SELECT count(*)::int AS can, coalesce(sum(so_tin), 0)::int AS tin FROM (${ds.sql}) x`, [5, ds.lim, "1"])).rows[0];
    console.log(`mẫu số (tin đang rao): ${mauSo.map((r) => `${r.kind}=${r.n}`).join(" · ")}`);
    console.log(`bước chấm: ${giay1.toFixed(1)} giây/lượt`);
    console.log("bảng đếm (cấp · kind · thước · ô · số tin):");
    for (const r of bang) console.log(`  ${r.cap} · ${r.kind} · ${r.thuoc} · ${r.o} · ${r.n}`);
    console.log(`dải m²: ${dai.n} nhóm dự án × PN, ${dai.mau} mẫu`);
    console.log(`can_ho_cap_du_an=${canHo}`);
    console.log(`op1_danh_sach_can=${op1.can} · op1_danh_sach_tin=${op1.tin}`);
    const dk = {
      lech: p.lech + d.lech, khong_dung_lai: p.khong_dung_lai + d.khong_dung_lai, sai_khoa: p.sai_khoa + d.sai_khoa,
      nhan_nhom_duoi_10: p.nhan_nhom_duoi_10, tong_lech: p.tong_lech, lan_hai_khac: anh1 === anh2 ? 0 : 1,
      can_ho_duoi_10000: canHo >= 10000 ? 0 : 1, op1_duoi_100: op1.can >= 100 ? 0 : 1,
    };
    for (const [k, v] of Object.entries(dk)) console.log(`${k}=${v}`);
    const sai = Object.entries(dk).filter(([, v]) => v !== 0).map(([k]) => k);
    if (dot) {
      const can = hong ? "lech" : "sai_khoa";
      console.log(sai.includes(can) ? `đối chứng ${hong ? "hỏng" : "khoá"}: đỏ đúng (${can} > 0)` : `đối chứng ${hong ? "hỏng" : "khoá"}: KHÔNG đỏ`);
      return sai.includes(can) ? 0 : 1;
    }
    console.log(sai.length ? `KẾT: hỏng — ${sai.join(", ")}` : "KẾT: đạt");
    return sai.length ? 1 : 0;
  } finally {
    await c.end();
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => process.exit(m), (e) => { console.error(e); process.exit(2); });
}
