// gia-tot-du-an-fixture.itest.mjs — hạ tầng test CG10 gia-tot-cap-du-an (_acceptance/gia-tot-cap-du-an).
// Mỗi ca chạy trên DB thử TRẮNG dựng từ db/migrations của nhánh (gồm 104, 106) bằng db-thu-dbv.mjs, nhân bản từ DB mẫu —
// không chép dữ liệu máy thu, nên ca không phụ thuộc bản chép có hay không có dòng hạng (bài học hotfix #461). View
// offer_project (105, hàng DV7) dựng theo từng ca: db/migrations/105_offer_project.sql khi đã có trong cây, không thì bản chép
// scripts/gia-tot-du-an-view105.sql — chỉ lấy câu CREATE VIEW. Tin gắn dự án qua phát biểu project_node_id của bài S03
// (field_assertions), đúng chứng cứ view đọc. Số là số bịa; không tên nguồn thật.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { GOC, MAY_CHU, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

export const M = 1_000_000;
const TEN = (k) => `oneinvest_dbv_cg10_${process.pid}_${k}`;

/** Câu CREATE VIEW offer_project — từ 105 của cây nếu có, không thì bản chép. */
export function sqlView105() {
  const mig = join(GOC, "db/migrations/105_offer_project.sql");
  const tep = existsSync(mig) ? mig : join(GOC, "pipeline/scripts/gia-tot-du-an-view105.sql");
  const m = readFileSync(tep, "utf8").match(/CREATE OR REPLACE VIEW offer_project AS[\s\S]*?;\s*$/m);
  if (!m) throw new Error(`gia-tot-du-an-fixture: không thấy CREATE VIEW offer_project trong ${tep}`);
  return m[0];
}

async function quanTri(sql) {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  try { await c.query(sql); } finally { await c.end(); }
}

const moi = [];
/** Dựng DB mẫu một lần cho cả tệp test. */
export async function dungMau() {
  await taoDbThu(TEN("mau"));
}
/** Dọn mọi DB của tệp test. */
export async function donHet() {
  for (const x of moi.splice(0)) { await x.c.end().catch(() => {}); await xoaDbThu(x.ten); }
  await xoaDbThu(TEN("mau"));
}

let nCa = 0;
/**
 * DB sạch cho một ca. `view`: dựng view offer_project; `luocDoView`: đặt view trong lược đồ khác và thêm lược đồ đó vào
 * search_path của client (ca dò theo search_path); `bo106`: bỏ bảng project_area_band (DB chưa áp 106).
 * Mồi một tỉnh, năm phường thử. Trả client đã nối.
 */
export async function dbCa({ view = true, luocDoView = null, bo106 = false } = {}) {
  const ten = TEN(`ca${++nCa}`);
  await quanTri(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
  await quanTri(`CREATE DATABASE ${ten} TEMPLATE ${TEN("mau")}`);
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${ten}` });
  await c.connect();
  moi.push({ ten, c });
  if (bo106) await c.query(`DROP TABLE project_area_band`);
  if (view) {
    if (luocDoView) {
      await c.query(`CREATE SCHEMA ${luocDoView}`);
      await c.query(`SET search_path TO public, ${luocDoView}`);
      await c.query(sqlView105().replace("CREATE OR REPLACE VIEW offer_project", `CREATE OR REPLACE VIEW ${luocDoView}.offer_project`));
    } else {
      await c.query(sqlView105());
    }
  }
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ('cg10-tinh', NULL, 'market', 'Tỉnh thử', 'vn')`);
  for (const w of ["a1", "a2", "a3", "a4", "a5"]) {
    await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, 'cg10-tinh', 'submarket', $1, 'vn')`,
      [`cg10-${w}`]);
  }
  return c;
}
export const A = (w) => `cg10-${w}`;

let nDuAn = 0;
/** Một nút dự án (cha: id dự án cha, để dựng dự án con). Trả id. */
export async function duAn(c, { ten = `Dự án thử ${++nDuAn}`, cha = null, loai = "project" } = {}) {
  const { rows: [r] } = await c.query(
    `INSERT INTO asset_nodes (node_type, name, slug, parent_id) VALUES ($1, $2, $3, $4) RETURNING id`,
    [loai, ten, `cg10-thu-${process.pid}-${nDuAn}-${Math.random().toString(36).slice(2, 8)}`, cha]);
  return Number(r.id);
}

let nNgay = 0;
/**
 * Một tin đang rao. `duAn`: id nút (hay mảng id → hai bài, mỗi bài một dự án → xung_dot); tin có dự án là tin S03 có bài
 * mang phát biểu project_node_id. last_seen tăng dần theo thứ tự chèn (tin chèn sau = thấy sau).
 */
export async function tin(c, o) {
  // Trong 45 ngày tính tới lúc chạy (danh sách /ops/deals lọc 45 ngày); tăng dần theo thứ tự chèn. `cu: true` → 60 ngày trước.
  const ngay = new Date(Date.now() - (o.cu ? 60 : 1) * 86_400_000 + (++nNgay) * 1000).toISOString();
  const duAnDs = o.duAn == null ? [] : Array.isArray(o.duAn) ? o.duAn : [o.duAn];
  const nguon = o.nguon ?? "S03";
  const bai = duAnDs.length ? duAnDs.map((_, i) => `${o.id}-b${i}`) : [];
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, kind, property_type, area_id, area_m2, price_perm2, price_vnd, bedrooms,
                                     first_seen, last_seen, source, price_tier, post_ids)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11, $12)`,
    [o.id, o.kind ?? "sale", o.loai === undefined ? "apartment" : o.loai, o.phuong === undefined ? A("a1") : o.phuong,
      o.m2 ?? null, o.perm2 ?? null, o.gia ?? (o.m2 && o.perm2 ? Math.round(o.m2 * o.perm2) : null), o.pn ?? null,
      o.lastSeen ?? ngay, nguon, nguon === "S06" ? "P2" : "P1", bai]);
  for (const [i, d] of duAnDs.entries()) await phatBieuDuAn(c, nguon, bai[i], d);
}
/** Phát biểu project_node_id của một bài (chứng cứ view 105 đọc). */
export async function phatBieuDuAn(c, nguon, postId, nodeId) {
  await c.query(
    `INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, observed_at) VALUES ($1, 'project_node_id', $2, 'observed', 'e1_rule', now())`,
    [`${nguon}:${postId}`, String(nodeId)]);
}
/** Một căn S06 gồm các tin cho trước. */
export async function can(c, offerIds) {
  const { rows: [p] } = await c.query(`INSERT INTO properties DEFAULT VALUES RETURNING id`);
  for (const id of offerIds) await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [p.id, id]);
  return p.id;
}
export const dongs = async (c) => Object.fromEntries((await c.query(`SELECT * FROM offer_price_rank`)).rows.map((r) => [r.offer_id, r]));
export const so = (x) => (x == null ? null : Number(x));

/** percentile_cont của Postgres. */
export function pct(sorted, p) {
  const pos = p * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
/** Số kỳ vọng của một nhóm phiếu, tính độc lập; `nhanLa` = mã nhãn của cấp. */
export function kyVong(values, nhanLa = "gia-tot") {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length, trungVi = pct(s, 0.5), p20 = pct(s, 0.2);
  const cua = (v) => {
    const duoi = Math.round((1 - v / trungVi) * 1000) / 10;
    const hang = n > 1 ? Math.round((s.filter((x) => x < v).length / (n - 1)) * 1000) / 10 : 0;
    const nhan = n >= 10 && v <= p20 && duoi >= 5 ? nhanLa : null;
    return { n, trungVi, p20, duoi, hang, nhan, canXacMinh: n >= 5 && duoi > 35 };
  };
  return { n, trungVi, p20, cua };
}
/** So một dòng với kỳ vọng; trả mảng lỗi nêu mã tin. */
export function soDong(r, kv, id) {
  const loi = [];
  if (!r) return [`${id}: không có dòng`];
  const gan = (a, b) => a != null && Math.abs(Number(a) - b) <= 0.1 + 1e-9 * Math.abs(b);
  if (so(r.n) !== kv.n) loi.push(`${id}: n=${r.n} ≠ ${kv.n}`);
  if (!gan(r.trung_vi, kv.trungVi)) loi.push(`${id}: trung_vi=${r.trung_vi} ≠ ${kv.trungVi}`);
  if (!gan(r.p20, kv.p20)) loi.push(`${id}: p20=${r.p20} ≠ ${kv.p20}`);
  if (!gan(r.hang_pct, kv.hang)) loi.push(`${id}: hang_pct=${r.hang_pct} ≠ ${kv.hang}`);
  if (!gan(r.duoi_trung_vi_pct, kv.duoi)) loi.push(`${id}: duoi_trung_vi_pct=${r.duoi_trung_vi_pct} ≠ ${kv.duoi}`);
  if ((r.nhan ?? null) !== kv.nhan) loi.push(`${id}: nhan=${r.nhan} ≠ ${kv.nhan}`);
  if (r.can_xac_minh !== kv.canXacMinh) loi.push(`${id}: can_xac_minh=${r.can_xac_minh} ≠ ${kv.canXacMinh}`);
  return loi;
}
