// hang-gia-fixture.itest.mjs — fixture dùng chung của phép đo CG9 bang-hang-gia-m2 cho các ca xuyên lớp (app/tests/hang-gia-doc.test.tsx):
// DB thử trống dựng từ db/migrations của nhánh (db-thu-dbv.mjs), tin viết trước, không gọi mã của hàng để tính kỳ vọng.
import pg from "pg";

import { MAY_CHU, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

export const M = 1_000_000;
export const A = (w) => `cg9-${w}`;

/** Mở một DB thử mới (đóng bằng `dong`). `hetSo: 103` = DB chưa có 104. */
export async function moDb(ten, opts = {}) {
  const url = await taoDbThu(ten, opts);
  const c = new pg.Client({ connectionString: url ?? `${MAY_CHU}/${ten}` });
  await c.connect();
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ('cg9-tinh', NULL, 'market', 'Tỉnh thử', 'vn')`);
  for (const w of ["a1", "a2", "a3", "a4"]) {
    await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, 'cg9-tinh', 'submarket', $2, 'vn')`,
      [A(w), `Phường ${w}`]);
  }
  return { c, dong: async () => { await c.end().catch(() => {}); await xoaDbThu(ten); } };
}

let nNgay = 0;
/** Một tin đang rao; last_seen tăng dần theo thứ tự chèn, trong 45 ngày tính tới lúc chạy. */
export async function tin(c, o) {
  // `cu: true` → thấy lần cuối 60 ngày trước (quá hạn 45 ngày của danh sách).
  const ngay = new Date(Date.now() - (o.cu ? 60 : 1) * 86_400_000 + (++nNgay) * 1000).toISOString();
  const nguon = o.nguon ?? "S03";
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, kind, property_type, area_id, area_m2, price_perm2, price_vnd, bedrooms,
                                     first_seen, last_seen, source, price_tier)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)`,
    [o.id, o.kind ?? "sale", o.loai === undefined ? "apartment" : o.loai, o.phuong === undefined ? A("a1") : o.phuong,
      o.m2 ?? null, o.perm2 ?? null, o.gia ?? (o.m2 && o.perm2 ? Math.round(o.m2 * o.perm2) : null), o.pn ?? null, ngay,
      nguon, nguon === "S06" ? "P2" : "P1"]);
}

/** Nhóm căn hộ bán phường a1: 12 phiếu, ba tin có nhãn (30 rẻ quá 35%, 42, 44), hai tin S06. */
export const NHOM_A1 = [30, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62].map((x) => x * M);

/**
 * Kịch bản đọc của CG9: nhóm a1 (bán, có nhãn, có tin S06, có tin cần xác minh), nhóm a2 (10 phiếu 2PN → chia PN), nhóm a3
 * (đất 7 phiếu → nhom-5-9), nhóm a4 (thuê có m², 10 phiếu), tin unknown.
 */
export async function fixtureDoc(c) {
  for (const [i, v] of NHOM_A1.entries()) {
    await tin(c, { id: `doc-a1-${i}`, m2: 60, perm2: v, nguon: i === 1 || i === 6 ? "S06" : "S03" });
  }
  for (let i = 0; i < 10; i++) await tin(c, { id: `doc-a2-${i}`, phuong: A("a2"), m2: 70, perm2: (40 + 2 * i) * M, pn: 2 });
  // Hai tin có nhãn nhưng phải rời danh sách: rẻ hơn trung vị quá 50% (trần cũ, Hỏi-2) và thấy lần cuối quá 45 ngày.
  await tin(c, { id: "doc-a2-qua-50", phuong: A("a2"), m2: 70, perm2: 15 * M, pn: 2 });
  await tin(c, { id: "doc-a2-qua-han", phuong: A("a2"), m2: 70, perm2: 41 * M, pn: 2, cu: true });
  for (let i = 0; i < 7; i++) await tin(c, { id: `doc-a3-${i}`, phuong: A("a3"), loai: "land", m2: 100, perm2: (30 + i) * M });
  for (let i = 0; i < 10; i++) {
    await tin(c, { id: `doc-a4-${i}`, kind: "rent_lt", phuong: A("a4"), m2: 60, perm2: (100 + 10 * i) * 1000 });
  }
  await tin(c, { id: "doc-unknown", loai: "unknown", m2: 60, perm2: 40 * M });
}

/**
 * Dữ liệu cho lối lùi thước CG8 (Hỏi-5) trên DB chưa có bảng hạng hay bảng rỗng: năm căn S06 căn hộ bán ở phường a1 (thước
 * v_ruler_p2 cần ≥ 5 căn) và số giảm sẵn cho hai tin P1 — để ca «bảng thiếu/rỗng» có dòng thật mà soi, không kiểm trên mảng rỗng.
 */
export async function fixtureCg8(c) {
  for (let i = 0; i < 5; i++) {
    const id = `cg8-s06-${i}`;
    await tin(c, { id, nguon: "S06", m2: 60, perm2: (50 + i) * M });
    const { rows: [p] } = await c.query(
      `INSERT INTO properties (area_id, property_type, kind) VALUES ($1, 'apartment', 'sale') RETURNING id`, [A("a1")]);
    await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [p.id, id]);
  }
  await c.query(`UPDATE sale_offer_records SET bait_gap_pct = 20 WHERE offer_id IN ('doc-a1-2', 'doc-a1-3')`);
}
