// can-gia-cung-loai-fixture.itest.mjs — fixture dùng chung của itest pipeline và test xuyên lớp app/data-api; hồ sơ can-gia-tot-cung-loai (CG8): số giảm của Căn giá tốt so với thước cùng phường × loại
// hình (v_ruler_p2), không lùi về thước cả phường (Hỏi-2). BEGIN…ROLLBACK trên DATABASE_URL (lượt chấm: DB thử
// oneinvest_u1_cg8); mỗi ca dựng lược đồ riêng (bản rỗng các bảng, view tin 044, thước 034, sellers 060) — không chạm dữ
// liệu dùng chung, không để lại dòng nào. Số là số bịa. Ma trận viết trước; một assert mỗi ô; có ca đột biến đỏ.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

import { luocDoRieng, neuLaBang } from "../lib/luoc-do-rieng.mjs";
import { MIG_060 } from "../lib/nap-060.mjs";

// Không mặc định về DB dùng chung: thiếu DATABASE_URL thì dừng (lượt chấm, npm test và can-gia-cung-loai-db.sh đều đặt DB thử).
const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) throw new Error("can-gia-cung-loai-fixture: thiếu DATABASE_URL — chạy qua can-gia-cung-loai-db.sh itest hoặc npm test (DB thử)");
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SQL_034 = readFileSync(join(ROOT, "db/migrations/034_ruler_p2_views.sql"), "utf8");
const BANG = ["sale_offer_records", "registry_aliases", "parties", "ref_lookup", "properties", "property_offers", "ops_audit", "areas", "stg_zalo_posts"];

export const PA = "vn-hanoi-t-cg8-a"; // có thước cho cả bốn loại + unknown
export const PB = "vn-hanoi-t-cg8-b"; // chỉ có thước «phòng» → có thước cả phường, thiếu thước cùng loại cho bốn loại
export const THI_TRUONG = "vn-hanoi-t-cg8"; // cha của hai phường thử (lọc `market`)
const TR = 1_000_000;
// Thước phường A: cỡ nhóm chọn để trung vị cả phường (135 tr) khác mọi thước cùng loại → bản đột biến đỏ ở mọi ô AC-1.
export const THUOC_A = { apartment: [10, 100 * TR], commercial: [5, 120 * TR], land: [5, 150 * TR], house: [5, 200 * TR], unknown: [5, 300 * TR] };
export const GIA_TIN = 80 * TR;
export const gapCua = (m) => Math.round((1 - GIA_TIN / m) * 1000) / 10;

/** Một giao dịch có lược đồ riêng; luôn ROLLBACK. */
export async function withTx(fn) {
  const c = new pg.Client({ connectionString: DB_URL });
  await c.connect();
  try {
    await c.query("BEGIN");
    await luocDoRieng(c, [...BANG, ...(await neuLaBang(c, "sellers"))], { tienTo: "cg8" });
    await c.query("CREATE VIEW sale_offers AS SELECT * FROM sale_offer_records WHERE retired_at IS NULL");
    await c.query(SQL_034);
    await c.query(MIG_060);
    return await fn(c);
  } finally {
    await c.query("ROLLBACK").catch(() => {});
    await c.end();
  }
}

async function tin(c, { id, area, type, kind = "sale", tier = "P1", source = "S03", perm2 = GIA_TIN }) {
  await c.query(
    `INSERT INTO sale_offers (offer_id, source, kind, confidence, first_seen, last_seen, post_ids, price_tier,
       property_type, area_id, area_m2, price_vnd, price_perm2)
     VALUES ($1, $2, $3, 'high', now(), now(), '{}', $4, $5, $6, 80, $7::bigint * 80, $7)`,
    [id, source, kind, tier, type, area, perm2],
  );
}

async function canThuoc(c, area, type, n, m, tag) {
  for (let i = 0; i < n; i++) {
    const oid = `cg8_thuoc_${tag}_${i}`;
    await tin(c, { id: oid, area, type, tier: "P2", source: "S06", perm2: m });
    const pid = (await c.query(`INSERT INTO properties (kind, area_id, property_type) VALUES ('sale', $1, $2) RETURNING id`, [area, type])).rows[0].id;
    await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [pid, oid]);
  }
}

/** Fixture chung: thước hai phường, bốn tin AC-1 (phường A), bảy ô AC-2. Trả mã tin theo vai. */
export async function dungFixture(c) {
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES
    ($1, $3, 'ward', 'Phường thử A', 'VN'), ($2, $3, 'ward', 'Phường thử B', 'VN')`, [PA, PB, THI_TRUONG]);
  for (const [type, [n, m]] of Object.entries(THUOC_A)) await canThuoc(c, PA, type, n, m, `a_${type}`);
  await canThuoc(c, PB, "room", 5, 70 * TR, "b_room");
  const ac1 = {};
  for (const type of ["apartment", "house", "land", "commercial"]) {
    ac1[type] = `cg8_ac1_${type}`;
    await tin(c, { id: ac1[type], area: PA, type });
  }
  const ac2 = {
    unknown: "cg8_ac2_unknown", null: "cg8_ac2_null",
    apartment: "cg8_ac2_b_apartment", house: "cg8_ac2_b_house", land: "cg8_ac2_b_land", commercial: "cg8_ac2_b_commercial",
    thue: "cg8_ac2_thue",
  };
  await tin(c, { id: ac2.unknown, area: PA, type: "unknown" });
  await tin(c, { id: ac2.null, area: PA, type: null });
  for (const type of ["apartment", "house", "land", "commercial"]) await tin(c, { id: ac2[type], area: PB, type });
  await tin(c, { id: ac2.thue, area: PA, type: "apartment", kind: "rent_lt" });
  return { ac1, ac2 };
}

