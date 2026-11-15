// hang-gia-do.mjs — hồ sơ bang-hang-gia-m2 (CG9), AC-9: đo bảng hạng giá trên DB thử chép từ DB máy thu (hang-gia-db.sh do).
// Áp 104 nếu chưa có, chạy bước chấm hai lần, rồi đếm độc lập bằng SQL viết riêng ở tệp này (không dùng 420):
//   · nhóm: với mỗi khoá nhóm có trong bảng, dựng lại phiếu (căn S06 nhỏ nhất hoặc chính tin, tin thấy sau cùng) từ sale_offers +
//     property_offers và tính lại n, trung vị → lech = số tin có n hay trung vị khác bảng;
//   · sai_khoa = số tin được chấm mà khoá nhóm ghi trong bảng (loại hình, bán/thuê) khác chính tin ở sale_offers, hay dòng
//     thước giá tháng mà không phải tin thuê — tức tin bị so với nhóm khác loại hay khác bán/thuê (đối chứng --doi-chung-khoa);
//   · nhan_nhom_duoi_10 = tin có nhãn ở nhóm dưới 10 phiếu; tong_lech = số dòng bảng khác số tin đang rao;
//   · lần hai giống lần một (so từng dòng trừ computed_at, run_id).
// In bảng đếm bán/thuê × (có nhãn · chỉ số · từng lý do không chấm) và mẫu số; thoát 1 nêu điều kiện hỏng.
// DB phải là DB thử oneinvest_<…> khác «oneinvest» (thoát 2). Hai đối chứng chấm bằng bản 420 đột biến, phép đếm phải đỏ (thoát 0
// khi đỏ đúng, 1 khi không đỏ): --doi-chung-hong «mỗi tin một phiếu» → lech > 0; --doi-chung-khoa «ghi kind cố định 'sale'» → sai_khoa > 0.
import { readFileSync, realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { SQL_420, xepHangGia } from "../xep-hang-gia.mjs";

const MIG = new URL("../../db/migrations/104_offer_price_rank.sql", import.meta.url);
const DOT_MOI_TIN = [
  "coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = t.offer_id),\n                  'o:' || t.offer_id) AS phieu",
  "'o:' || t.offer_id AS phieu"];
const DOT_KHOA = ["SELECT l.offer_id, l.kind, l.property_type, l.bedrooms, l.thuoc,", "SELECT l.offer_id, 'sale', l.property_type, l.bedrooms, l.thuoc,"];
const CHAM = `(r.ly_do IS NULL OR r.ly_do IN ('nhom-5-9', 'nhom-duoi-5', 'pn-duoi-10'))`;

/** Câu đếm độc lập: dựng lại nhóm của từng khoá có trong bảng. */
export const SQL_DO = `
WITH tin AS (
  SELECT o.offer_id, o.kind, o.property_type, o.area_id, o.bedrooms, o.last_seen, o.price_perm2, o.price_vnd,
         coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id), 'o:' || o.offer_id) AS phieu
    FROM sale_offers o
), hop_le AS (     -- tin được chấm theo chính bảng (luật loại tin đã có ca riêng ở hang-gia.test.mjs)
  SELECT t.*, r.thuoc FROM tin t JOIN offer_price_rank r ON r.offer_id = t.offer_id WHERE ${CHAM}
), khoa AS (
  SELECT DISTINCT r.thuoc, r.nut, r.property_type, r.kind, r.pn_nhom FROM offer_price_rank r WHERE r.cap = 'phuong' AND ${CHAM}
), thanh_vien AS (
  SELECT k.thuoc, k.nut, k.property_type, k.kind, k.pn_nhom, h.phieu, h.last_seen, h.offer_id, h.bedrooms,
         h.property_type AS loai_tv, h.kind AS kind_tv,
         CASE k.thuoc WHEN 'gia-m2' THEN h.price_perm2::numeric ELSE h.price_vnd::numeric END AS v
    FROM khoa k
    JOIN tin h ON h.area_id = k.nut AND h.property_type = k.property_type
              AND (k.thuoc = 'gia-thang-pn' OR h.kind = k.kind)
   WHERE (k.thuoc = 'gia-m2' AND EXISTS (SELECT 1 FROM hop_le x WHERE x.offer_id = h.offer_id AND x.thuoc = 'gia-m2'))
      OR (k.thuoc = 'gia-thang-pn' AND h.kind = 'rent_lt' AND h.bedrooms = k.pn_nhom
          AND h.price_vnd BETWEEN 1000000 AND 500000000
          AND EXISTS (SELECT 1 FROM hop_le x WHERE x.offer_id = h.offer_id))
), phieu AS (      -- tin đại diện của phiếu trong nhóm (thấy sau cùng); nhóm chia PN giữ phiếu mà tin đại diện có đúng số PN
  SELECT * FROM (
    SELECT DISTINCT ON (thuoc, nut, property_type, kind, pn_nhom, phieu) *
      FROM thanh_vien ORDER BY thuoc, nut, property_type, kind, pn_nhom, phieu, last_seen DESC NULLS LAST, offer_id) d
   WHERE thuoc = 'gia-thang-pn' OR pn_nhom IS NULL OR bedrooms = pn_nhom
), st AS (
  SELECT thuoc, nut, property_type, kind, pn_nhom, count(*)::int AS n,
         percentile_cont(0.5) WITHIN GROUP (ORDER BY v) AS tv
    FROM phieu GROUP BY 1, 2, 3, 4, 5
)
SELECT
  (SELECT count(*) FROM offer_price_rank r JOIN st USING (thuoc, nut, property_type, kind)
    WHERE r.cap = 'phuong' AND ${CHAM} AND r.pn_nhom IS NOT DISTINCT FROM st.pn_nhom
      AND (r.n IS DISTINCT FROM st.n OR (r.trung_vi IS NOT NULL AND abs(r.trung_vi - st.tv) > 0.5)))::int AS lech,
  (SELECT count(*) FROM offer_price_rank r WHERE r.cap = 'phuong' AND ${CHAM}
      AND NOT EXISTS (SELECT 1 FROM st WHERE st.thuoc = r.thuoc AND st.nut = r.nut AND st.property_type = r.property_type
                       AND st.kind = r.kind AND st.pn_nhom IS NOT DISTINCT FROM r.pn_nhom))::int AS khong_dung_lai,
  (SELECT count(*) FROM offer_price_rank r JOIN sale_offers o USING (offer_id)
    WHERE r.hang_pct IS NOT NULL
      AND (r.kind IS DISTINCT FROM o.kind OR r.property_type IS DISTINCT FROM o.property_type
           OR (r.thuoc = 'gia-thang-pn' AND r.kind <> 'rent_lt')))::int AS sai_khoa,
  (SELECT count(*) FROM offer_price_rank WHERE nhan IS NOT NULL AND n < 10)::int AS nhan_nhom_duoi_10,
  ((SELECT count(*) FROM offer_price_rank) - (SELECT count(*) FROM sale_offers))::int AS tong_lech`;

const BANG_DEM = `
SELECT kind,
       CASE WHEN nhan IS NOT NULL THEN 'co-nhan' WHEN hang_pct IS NOT NULL THEN 'chi-so' ELSE 'khong-cham:' || split_part(ly_do, ':', 1) END AS o,
       count(*)::int AS n
  FROM offer_price_rank GROUP BY 1, 2 ORDER BY 1, 2`;
const ANH = `SELECT md5(string_agg(row(offer_id, kind, property_type, bedrooms, thuoc, gia_tri, cap, nut, pn_nhom, n, trung_vi, p20,
  hang_pct, duoi_trung_vi_pct, nhan, can_xac_minh, ly_do)::text, '|' ORDER BY offer_id)) AS h FROM offer_price_rank`;

async function main() {
  const url = process.env.DATABASE_URL ?? "";
  const ten = url.split("?")[0].split("/").pop();
  if (!/^oneinvest_[a-z0-9_]+$/.test(ten ?? "")) {
    console.error(`hang-gia-do: chỉ chạy trên DB thử oneinvest_<…>, không phải «${ten}»`);
    return 2;
  }
  const hong = process.argv.includes("--doi-chung-hong");
  const khoa = process.argv.includes("--doi-chung-khoa");
  const c = new pg.Client({ connectionString: url });
  await c.connect();
  try {
    await c.query(readFileSync(MIG, "utf8"));
    const dot = hong ? DOT_MOI_TIN : khoa ? DOT_KHOA : null;
    const sql = dot ? SQL_420.split(dot[0]).join(dot[1]) : SQL_420;
    if (dot && sql === SQL_420) throw new Error("đột biến rỗng — không thấy chuỗi cần thay trong 420");
    const t0 = Date.now();
    await xepHangGia(c, { sql, log: () => {} });
    const giay1 = (Date.now() - t0) / 1000;
    const anh1 = (await c.query(ANH)).rows[0].h;
    await xepHangGia(c, { sql, log: () => {} });
    const anh2 = (await c.query(ANH)).rows[0].h;
    const d = (await c.query(SQL_DO)).rows[0];
    const bang = (await c.query(BANG_DEM)).rows;
    const mauSo = (await c.query(`SELECT kind, count(*)::int AS n FROM sale_offers GROUP BY 1 ORDER BY 1`)).rows;
    console.log(`mẫu số (tin đang rao): ${mauSo.map((r) => `${r.kind}=${r.n}`).join(" · ")}`);
    console.log(`bước chấm: ${giay1.toFixed(1)} giây/lượt`);
    console.log("bảng đếm (kind · ô · số tin):");
    for (const r of bang) console.log(`  ${r.kind} · ${r.o} · ${r.n}`);
    const dk = { lech: d.lech, khong_dung_lai: d.khong_dung_lai, sai_khoa: d.sai_khoa, nhan_nhom_duoi_10: d.nhan_nhom_duoi_10,
      tong_lech: d.tong_lech, lan_hai_khac: anh1 === anh2 ? 0 : 1 };
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
