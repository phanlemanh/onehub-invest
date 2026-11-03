#!/usr/bin/env node
// do-so-ghep-s06.mjs — hồ sơ so-ghep-s06-nhan-danh-ba E9: đo trên DB thử (bash db/db-thu.sh oneinvest_sg) tác động của 068, 070,
// bộ gán và bộ dựng danh bạ lên dữ liệu thật: bí danh, người, người không có tin, sellers, tin có nhãn. COMMIT trên DB thử để
// bước nhìn giao diện dùng lại; từ chối chạy trên DB dùng chung. Chỉ in số đếm, không in SĐT.
// Thoát: 0 đạt · 1 bất biến sai hoặc lỗi · 2 DB không phải DB thử.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { ganSdtS06, inKhongSo } from "./gan-sdt-s06.mjs";
import { coBangChungSdt, dungNguoi, RULE_TRUC_TIEP, rutDinhDanh, SQL } from "./lib/danh-ba-nguoi.mjs";
import { nap068 } from "./lib/nap-068.mjs";
import { nap070 } from "./lib/nap-070.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** @returns {string|null} lời từ chối, hoặc null khi tên DB là DB thử */
export function tuChoiDb(ten) {
  return /^oneinvest_[a-z0-9_]+$/.test(ten) ? null : `«${ten}» không phải DB thử: chạy bash db/db-thu.sh oneinvest_sg rồi trỏ DATABASE_URL vào đó`;
}

/** Bốn bất biến của E9, trả tên khoá sai. */
export function kiemBatBienSoGhep(so) {
  const loi = [];
  if (so.so_ghep_ra_so > 0) loi.push("so_ghep_ra_so");
  if (so.so_ghep_ra_so_neu_bo_nhanh === 0) loi.push("so_ghep_ra_so_neu_bo_nhanh");
  if (so.bi_danh_moi <= 0 || so.bi_danh_moi > so.so_truc_tiep) loi.push("bi_danh_moi");
  if (so.nhan_ban + so.nhan_thue <= 0 || so.nhan_ban + so.nhan_thue !== so.tin_khong_dau) loi.push("tong_nhan");
  return loi;
}

/** Số đếm đọc được cả trước 070: nhãn đi qua to_jsonb nên view chưa có cột vẫn trả 0. */
export async function docMoc(c) {
  const { rows: [r] } = await c.query(`
    SELECT (SELECT count(*)::int FROM registry_aliases WHERE source = 'S06' AND kind = 'sdt' AND retired_at IS NULL) AS bi_danh,
           (SELECT count(*)::int FROM parties) AS nguoi,
           (SELECT count(*)::int FROM parties p WHERE p.status = 'active' AND NOT EXISTS
              (SELECT 1 FROM party_roles v WHERE v.party_key = p.party_key AND v.retracted_at IS NULL)) AS nguoi_khong_tin,
           (SELECT count(*)::int FROM sellers) AS sellers,
           (SELECT count(*)::int FROM sale_offers o WHERE o.kind = 'sale' AND to_jsonb(o) ->> 'seller_phone_inferred' = 'true') AS nhan_ban,
           (SELECT count(*)::int FROM sale_offers o WHERE o.kind <> 'sale' AND to_jsonb(o) ->> 'seller_phone_inferred' = 'true') AS nhan_thue`);
  return r;
}

/**
 * Hai số của nhánh ở rutDinhDanh, tính trên chính hàm thật: tin có số mà không mang dấu trực tiếp ra bao nhiêu số, và ra bao
 * nhiêu nếu bỏ nhánh (giả dấu trực tiếp cho tin đó). Tin không dấu đếm lại bằng hàm JS, độc lập với cột tính của view.
 */
export async function docNhanhSoGhep(c) {
  const { rows: tins } = await c.query(SQL.tin, [["S06"]]);
  const coSo = tins.filter((t) => t.seller_phone);
  const ghep = coSo.filter((t) => !coBangChungSdt(t));
  const raSo = (t) => rutDinhDanh(t, new Map()).sdt !== null;
  const gia = { seller_phone: { rule_id: RULE_TRUC_TIEP } };
  const { rows: song } = await c.query(`SELECT field_provenance FROM sale_offers WHERE source = 'S06' AND seller_phone IS NOT NULL`);
  return {
    so_truc_tiep: new Set(coSo.filter(coBangChungSdt).map((t) => t.seller_phone)).size,
    so_ghep_ra_so: ghep.filter(raSo).length,
    so_ghep_ra_so_neu_bo_nhanh: ghep.filter((t) => raSo({ ...t, field_provenance: gia })).length,
    tin_khong_dau: song.filter((t) => !coBangChungSdt(t)).length,
  };
}

/** Các dòng in, đều đi qua chặn số. */
export function veDong(truoc, sau, nhanh) {
  const dong = (ten) => `${ten} truoc=${truoc[ten]} sau=${sau[ten]}`;
  return [
    `${dong("bi_danh")} bi_danh_moi=${sau.bi_danh - truoc.bi_danh}`,
    `${dong("nguoi")} nguoi_moi=${sau.nguoi - truoc.nguoi}`,
    dong("nguoi_khong_tin"),
    dong("sellers"),
    dong("nhan_ban"),
    dong("nhan_thue"),
    `so_ghep_ra_so=${nhanh.so_ghep_ra_so} so_ghep_ra_so_neu_bo_nhanh=${nhanh.so_ghep_ra_so_neu_bo_nhanh} `
      + `so_truc_tiep=${nhanh.so_truc_tiep} tin_khong_dau=${nhanh.tin_khong_dau}`,
  ].map(inKhongSo);
}

async function main() {
  const tuChoiUrl = tuChoiDb(new URL(DB_URL).pathname.slice(1));
  if (tuChoiUrl) {
    console.error(`do-so-ghep-s06: ${tuChoiUrl}`);
    process.exit(2);
  }
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    const { rows: [{ ten }] } = await c.query("SELECT current_database() AS ten");
    const tuChoi = tuChoiDb(ten);
    if (tuChoi) {
      console.error(`do-so-ghep-s06: ${tuChoi}`);
      process.exitCode = 2;
      return;
    }
    await c.query("BEGIN");
    const truoc = await docMoc(c);
    await nap068(c);
    await nap070(c);
    const gan = await ganSdtS06(c);
    console.log(inKhongSo(`gan doi=${gan.doi} truc_tiep=${gan.truc_tiep} ghep=${gan.ghep} rut=${gan.rut} bo_qua=${gan.bo_qua}`));
    await dungNguoi(c, { out: (l) => console.log(inKhongSo(l)) });
    const sau = await docMoc(c);
    const nhanh = await docNhanhSoGhep(c);
    await c.query("COMMIT");
    for (const l of veDong(truoc, sau, nhanh)) console.log(l);
    const loi = kiemBatBienSoGhep({ ...sau, ...nhanh, bi_danh_moi: sau.bi_danh - truoc.bi_danh });
    if (loi.length) {
      console.error(`BẤT BIẾN SAI: ${loi.join(", ")}`);
      process.exitCode = 1;
    }
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((e) => { console.error(e.message); process.exit(1); });
