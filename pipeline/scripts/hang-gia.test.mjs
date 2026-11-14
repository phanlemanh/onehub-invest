// hang-gia.test.mjs — phép đo CG9 bang-hang-gia-m2 (_acceptance/bang-hang-gia-m2): AC-1…AC-5, AC-11.
// Mỗi ca chạy trên DB thử trống dựng từ db/migrations của nhánh (gồm 104) bằng db-thu-dbv.mjs, nhân bản từ DB mẫu; fixture viết
// trước, số kỳ vọng tính độc lập bằng kyVong() (không gọi mã của hàng). Chiều đỏ: thay đúng một chuỗi trong SQL_420 rồi chạy lại
// bước chấm trên cùng fixture — bộ kiểm phải trả lỗi nêu mã tin.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

import { SQL_420, xepHangGia } from "../xep-hang-gia.mjs";
import { GOC, MAY_CHU, taoDbThu, xoaDbThu } from "./db-thu-dbv.mjs";

const MIG = join(GOC, "db/migrations/104_offer_price_rank.sql");
const TEN = (k) => `oneinvest_dbv_cg9_${process.pid}_${k}`;
const im = { log: () => {} };
const M = 1_000_000;

// ---------- DB thử ----------
const moi = [];
async function quanTri(sql) {
  const c = new pg.Client({ connectionString: `${MAY_CHU}/postgres` });
  await c.connect();
  try { await c.query(sql); } finally { await c.end(); }
}
before(async () => {
  await Promise.all([taoDbThu(TEN("mau")), taoDbThu(TEN("mau103"), { hetSo: 103 })]);
});
after(async () => {
  for (const x of moi) { await x.c.end().catch(() => {}); await xoaDbThu(x.ten); }
  await xoaDbThu(TEN("mau"));
  await xoaDbThu(TEN("mau103"));
});
let nCa = 0;
/** DB sạch cho một ca, nhân bản từ mẫu; mồi một tỉnh và các phường thử. */
async function dbCa(mau = "mau") {
  const ten = TEN(`ca${++nCa}`);
  await quanTri(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
  await quanTri(`CREATE DATABASE ${ten} TEMPLATE ${TEN(mau)}`);
  const c = new pg.Client({ connectionString: `${MAY_CHU}/${ten}` });
  await c.connect();
  moi.push({ ten, c });
  await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ('cg9-tinh', NULL, 'market', 'Tỉnh thử', 'vn')`);
  for (const w of ["a1", "a2", "a3", "a4", "a5"]) {
    await c.query(`INSERT INTO areas (id, parent_id, region_type, name, country_code) VALUES ($1, 'cg9-tinh', 'submarket', $1, 'vn')`,
      [`cg9-${w}`]);
  }
  return c;
}
const A = (w) => `cg9-${w}`;
let nNgay = 0;
/** Một tin đang rao. last_seen tăng dần theo thứ tự chèn (tin chèn sau = thấy sau). */
async function tin(c, o) {
  const ngay = new Date(Date.UTC(2026, 10, 1) + (++nNgay) * 60_000).toISOString();
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, kind, property_type, area_id, area_m2, price_perm2, price_vnd, bedrooms,
                                     first_seen, last_seen, source, price_tier)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10, $11)`,
    [o.id, o.kind ?? "sale", o.loai === undefined ? "apartment" : o.loai, o.phuong === undefined ? A("a1") : o.phuong,
      o.m2 ?? null, o.perm2 ?? null, o.gia ?? (o.m2 && o.perm2 ? Math.round(o.m2 * o.perm2) : null), o.pn ?? null, ngay,
      o.nguon ?? "S03", (o.nguon ?? "S03") === "S06" ? "P2" : "P1"]);
}
/** Một căn S06 gồm các tin cho trước. */
async function can(c, offerIds) {
  const { rows: [p] } = await c.query(`INSERT INTO properties DEFAULT VALUES RETURNING id`);
  for (const id of offerIds) await c.query(`INSERT INTO property_offers (property_id, offer_id) VALUES ($1, $2)`, [p.id, id]);
  return p.id;
}
const dongs = async (c) => Object.fromEntries((await c.query(`SELECT * FROM offer_price_rank`)).rows.map((r) => [r.offer_id, r]));
const so = (x) => (x == null ? null : Number(x));

// ---------- kỳ vọng tính độc lập ----------
/** percentile_cont của Postgres. */
function pct(sorted, p) {
  const pos = p * (sorted.length - 1);
  const lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}
/** Số kỳ vọng của một nhóm phiếu cho từng giá trị. */
function kyVong(values) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length, trungVi = pct(s, 0.5), p20 = pct(s, 0.2);
  const cua = (v) => {
    const duoi = Math.round((1 - v / trungVi) * 1000) / 10;
    const hang = n > 1 ? Math.round((s.filter((x) => x < v).length / (n - 1)) * 1000) / 10 : 0;
    const nhan = n >= 10 && v <= p20 && duoi >= 5 ? "re-trong-phuong" : null;
    return { n, trungVi, p20, duoi, hang, nhan, canXacMinh: n >= 5 && duoi > 35 };
  };
  return { n, trungVi, p20, cua };
}
/** So một dòng với kỳ vọng; trả mảng lỗi nêu mã tin. */
function soDong(r, kv, id) {
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
/** Bản SQL đột biến: thay từng cặp chuỗi, chuỗi phải có mặt. */
function dot(...cap) {
  let s = SQL_420;
  for (const [cu, moiChuoi] of cap) {
    assert.ok(s.includes(cu), `đột biến rỗng: không thấy «${cu.slice(0, 70)}» trong 420`);
    s = s.split(cu).join(moiChuoi);
  }
  return s;
}
const DOT_BO_5 = ["AND round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) >= 5 THEN 're-trong-phuong'", "THEN 're-trong-phuong'"];
const DOT_NGUONG_5 = ["so.n >= 10 AND so.gia_tri <= so.p20", "so.n >= 5 AND so.gia_tri <= so.p20"];
const DOT_MOI_TIN = [
  "coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = t.offer_id),\n                  'o:' || t.offer_id) AS phieu",
  "'o:' || t.offer_id AS phieu"];
const DOT_BO_KIND = [
  ["'all|' || area_id || '|' || property_type || '|' || kind AS g", "'all|' || area_id || '|' || property_type AS g"],
  ["ELSE 'all|' || vv.area_id || '|' || vv.property_type || '|' || vv.kind", "ELSE 'all|' || vv.area_id || '|' || vv.property_type"],
  ["'pn|' || area_id || '|' || property_type || '|' || kind || '|' || bedrooms", "'pn|' || area_id || '|' || property_type || '|' || bedrooms"],
  ["'pn|' || vv.area_id || '|' || vv.property_type || '|' || vv.kind || '|' || vv.bedrooms", "'pn|' || vv.area_id || '|' || vv.property_type || '|' || vv.bedrooms"]];

// ---------- AC-1: ngưỡng nhóm và điều kiện nhãn ----------
const NHOM_12 = [40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62].map((x) => x * M);           // căn hộ: ≤ p20 và ≥ 5%
const NHOM_12_SAT = [49, 49.5, 50, 50, 50, 50, 50, 50, 51, 51, 52, 52].map((x) => x * M);      // nhà: ≤ p20 mà < 5%; trung vị = p20
const NHOM_7 = [30, 50, 51, 52, 53, 54, 55].map((x) => x * M);                                // đất: 5–9
const NHOM_4 = [40, 50, 60, 70].map((x) => x * M);                                            // thương mại: dưới 5
async function fixtureAc1(c) {
  const bo = { apartment: NHOM_12, house: NHOM_12_SAT, land: NHOM_7, commercial: NHOM_4 };
  for (const [loai, vals] of Object.entries(bo)) {
    for (const [i, v] of vals.entries()) await tin(c, { id: `ac1-${loai}-${i}`, loai, m2: 60, perm2: v });
  }
  return bo;
}
function kiemAc1(d, bo) {
  const loi = [];
  for (const loai of ["apartment", "house"]) {
    const kv = kyVong(bo[loai]);
    bo[loai].forEach((v, i) => loi.push(...soDong(d[`ac1-${loai}-${i}`], kv.cua(v), `ac1-${loai}-${i}`)));
  }
  const kv7 = kyVong(bo.land);
  bo.land.forEach((v, i) => {
    const id = `ac1-land-${i}`, r = d[id], k = kv7.cua(v);
    loi.push(...soDong(r, { ...k, nhan: null }, id));
    if (r?.ly_do !== "nhom-5-9") loi.push(`${id}: ly_do=${r?.ly_do} ≠ nhom-5-9`);
  });
  bo.commercial.forEach((_, i) => {
    const id = `ac1-commercial-${i}`, r = d[id];
    if (r?.ly_do !== "nhom-duoi-5") loi.push(`${id}: ly_do=${r?.ly_do} ≠ nhom-duoi-5`);
    if (r?.hang_pct != null || r?.trung_vi != null || r?.nhan != null) loi.push(`${id}: nhóm dưới 5 mà có số hay nhãn`);
  });
  return loi;
}
test("CG9-AC-1 ngưỡng nhóm 12 · 7 · 4 và điều kiện nhãn; đột biến bỏ 5% và hạ ngưỡng 10 đỏ", async () => {
  const c = await dbCa();
  const bo = await fixtureAc1(c);
  await xepHangGia(c, { log: im.log });
  const d = await dongs(c);
  assert.deepEqual(kiemAc1(d, bo), []);
  assert.equal(d["ac1-apartment-0"].nhan, "re-trong-phuong", "đối chứng dương: căn rẻ nhất nhóm 12 có nhãn");
  assert.equal(d["ac1-house-0"].nhan, null, "≤ p20 mà dưới trung vị chưa tới 5% thì không nhãn");
  for (const [ten, cap, mau] of [["bỏ 5%", DOT_BO_5, "ac1-house-0"], ["ngưỡng 5", DOT_NGUONG_5, "ac1-land-0"]]) {
    await xepHangGia(c, { log: im.log, sql: dot(cap) });
    const loi = kiemAc1(await dongs(c), bo);
    assert.ok(loi.some((x) => x.startsWith(mau)), `đột biến «${ten}» phải đỏ ở ${mau}; lỗi: ${loi.join(" | ")}`);
  }
});

// ---------- AC-2: mỗi căn một phiếu ----------
async function fixtureAc2(c) {
  const p = "cg9-a2";
  await tin(c, { id: "ac2-s6a", nguon: "S06", phuong: p, m2: 60, perm2: 50 * M });
  await tin(c, { id: "ac2-s6b", nguon: "S06", phuong: p, m2: 60, perm2: 60 * M });
  await tin(c, { id: "ac2-s6c", nguon: "S06", phuong: p, m2: 60, perm2: 55 * M });   // thấy sau cùng của căn
  await tin(c, { id: "ac2-s6x", nguon: "S06", phuong: p, m2: 60, perm2: 47 * M });   // gắn hai căn
  await can(c, ["ac2-s6a", "ac2-s6b", "ac2-s6c"]);
  await can(c, ["ac2-s6x"]);
  await can(c, ["ac2-s6x"]);
  const s03 = [44, 45, 48, 49, 51, 52, 53, 56, 58].map((x) => x * M);
  for (const [i, v] of s03.entries()) await tin(c, { id: `ac2-s3-${i}`, phuong: p, m2: 60, perm2: v });
  return [55 * M, 47 * M, ...s03];   // phiếu: căn ba tin (55), căn của s6x (47), 9 tin S03
}
function kiemAc2(d, phieu) {
  const loi = [];
  const kv = kyVong(phieu);
  for (const id of ["ac2-s6a", "ac2-s6b", "ac2-s6c"]) loi.push(...soDong(d[id], kv.cua(55 * M), id));
  loi.push(...soDong(d["ac2-s6x"], kv.cua(47 * M), "ac2-s6x"));
  return loi;
}
test("CG9-AC-2 căn ba tin một phiếu (tin thấy sau cùng), tin hai căn một phiếu, S03 chung nhóm; đột biến mỗi tin một phiếu đỏ", async () => {
  const c = await dbCa();
  const phieu = await fixtureAc2(c);
  await xepHangGia(c, { log: im.log });
  const d = await dongs(c);
  assert.deepEqual(kiemAc2(d, phieu), []);
  assert.equal(so(d["ac2-s3-0"].n), 11, "tin S03 chung nhóm với S06, n = 11 phiếu");
  assert.equal(d["ac2-s6a"].hang_pct, d["ac2-s6c"].hang_pct, "mọi tin một căn cùng hạng");
  await xepHangGia(c, { log: im.log, sql: dot(DOT_MOI_TIN) });
  const loi = kiemAc2(await dongs(c), phieu);
  assert.ok(loi.some((x) => x.includes("n=13 ≠ 11")), `đột biến mỗi tin một phiếu phải đỏ (n mong đợi 11, thật 13); lỗi: ${loi.join(" | ")}`);
});

// ---------- AC-3: lùi cấp và lý do ----------
test("CG9-AC-3 ma trận 12 ô: chia PN, lùi PN, không PN, sáu lý do không chấm, cần xác minh", async () => {
  const c = await dbCa();
  const p = A("a3");
  const pn2 = [30, 60, 61, 62, 63, 64, 65, 66, 67, 68].map((x) => x * M);   // 10 phiếu 2PN, 30 rẻ quá 35%
  for (const [i, v] of pn2.entries()) await tin(c, { id: `ac3-pn2-${i}`, phuong: p, m2: 70, perm2: v, pn: 2 });
  await tin(c, { id: "ac3-pn3-a", phuong: p, m2: 90, perm2: 62 * M, pn: 3 });
  await tin(c, { id: "ac3-pn3-b", phuong: p, m2: 90, perm2: 63 * M, pn: 3 });
  await tin(c, { id: "ac3-khong-pn", phuong: p, m2: 70, perm2: 64 * M });
  await tin(c, { id: "ac3-unknown", phuong: p, loai: "unknown", m2: 70, perm2: 64 * M });
  await tin(c, { id: "ac3-null", phuong: p, loai: null, m2: 70, perm2: 64 * M });
  await tin(c, { id: "ac3-khong-phuong", phuong: null, m2: 70, perm2: 64 * M });
  await tin(c, { id: "ac3-khong-gia", phuong: p });
  await tin(c, { id: "ac3-ngoai-khoang", phuong: p, m2: 70, perm2: 600 * M });
  await tin(c, { id: "ac3-dt-nho", phuong: p, m2: 5, perm2: 64 * M });
  await tin(c, { id: "ac3-phong-nho", phuong: p, m2: 40, perm2: 64 * M, pn: 3 });
  await xepHangGia(c, { log: im.log });
  const d = await dongs(c);
  assert.equal(so(d["ac3-pn2-1"].pn_nhom), 2, "PN đủ 10: chia PN");
  assert.equal(d["ac3-pn2-1"].ly_do, null, "PN đủ 10: không lý do lùi");
  assert.equal(d["ac3-pn3-a"].pn_nhom, null, "PN dưới 10: lùi về nhóm không chia PN");
  assert.equal(d["ac3-pn3-a"].ly_do, "pn-duoi-10");
  assert.equal(so(d["ac3-pn3-a"].n), 13, "nhóm lùi gồm mọi phiếu căn hộ bán của phường (10 + 2 + 1)");
  assert.equal(d["ac3-khong-pn"].pn_nhom, null);
  assert.equal(d["ac3-khong-pn"].ly_do, null, "không PN: không lý do lùi");
  assert.equal(d["ac3-unknown"].ly_do, "chua-ro-loai");
  assert.equal(d["ac3-null"].ly_do, "chua-ro-loai");
  assert.equal(d["ac3-khong-phuong"].ly_do, "thieu-phuong");
  assert.equal(d["ac3-khong-gia"].ly_do, "thieu-gia");
  assert.equal(d["ac3-ngoai-khoang"].ly_do, "ngoai-khoang");
  assert.equal(d["ac3-dt-nho"].ly_do, "phi-ly:dien-tich-ngoai-khoang");
  assert.equal(d["ac3-phong-nho"].ly_do, "phi-ly:phong-qua-nho");
  assert.equal(d["ac3-pn2-0"].nhan, "re-trong-phuong", "rẻ quá 35% vẫn mang nhãn");
  assert.equal(d["ac3-pn2-0"].can_xac_minh, true, "rẻ quá 35% → cần xác minh");
  assert.equal(d["ac3-pn2-5"].can_xac_minh, false, "đối chứng: căn giữa nhóm không cần xác minh");
  for (const id of ["ac3-unknown", "ac3-khong-phuong", "ac3-dt-nho"]) assert.equal(d[id].hang_pct, null, `${id}: không chấm thì không số`);
});

// ---------- AC-4: tin thuê ----------
async function fixtureAc4(c) {
  const p = A("a4");
  const m2 = [100, 120, 130, 140, 150, 160, 170, 180, 190, 200].map((x) => x * 1000);   // giá thuê/m²/tháng
  for (const [i, v] of m2.entries()) await tin(c, { id: `ac4-m2-${i}`, kind: "rent_lt", phuong: p, m2: 60, perm2: v, pn: 2 });
  await tin(c, { id: "ac4-pn2", kind: "rent_lt", phuong: p, gia: 7 * M, pn: 2 });
  await tin(c, { id: "ac4-pn1", kind: "rent_lt", phuong: p, gia: 5 * M, pn: 1 });
  await tin(c, { id: "ac4-khong-ca-hai", kind: "rent_lt", phuong: p, gia: 6 * M });
  await tin(c, { id: "ac4-ngoai-khoang", kind: "rent_lt", phuong: p, m2: 60, perm2: 5 * M, pn: 2 });
  for (let i = 0; i < 6; i++) await tin(c, { id: `ac4-ban-${i}`, phuong: p, m2: 60, perm2: (40 + i) * M, pn: 2 });
  for (let i = 0; i < 5; i++) await tin(c, { id: `ac4-room-${i}`, kind: "rent_lt", loai: "room", phuong: p, m2: 20, perm2: (100 + 10 * i) * 1000 });
  return { m2, thang2: [...m2.map((v) => Math.round(60 * v)), 7 * M] };
}
function kiemAc4(d, fx) {
  const loi = [];
  const kv = kyVong(fx.m2);
  fx.m2.forEach((v, i) => {
    const id = `ac4-m2-${i}`;
    if (d[id]?.thuoc !== "gia-m2") loi.push(`${id}: thuoc=${d[id]?.thuoc}`);
    loi.push(...soDong(d[id], kv.cua(v), id));
  });
  return loi;
}
test("CG9-AC-4 thuê: có m² so giá/m² trong nhóm thuê; thiếu m² so giá tháng cùng PN; 1PN dưới 5; thiếu cả hai; ngoài khoảng; đột biến bỏ kind đỏ", async () => {
  const c = await dbCa();
  const fx = await fixtureAc4(c);
  await xepHangGia(c, { log: im.log });
  const d = await dongs(c);
  assert.deepEqual(kiemAc4(d, fx), []);
  const r = d["ac4-pn2"], kv = kyVong(fx.thang2);
  assert.equal(r.thuoc, "gia-thang-pn");
  assert.equal(so(r.pn_nhom), 2);
  assert.deepEqual(soDong(r, kv.cua(7 * M), "ac4-pn2"), []);
  assert.equal(d["ac4-pn1"].ly_do, "nhom-duoi-5");
  assert.equal(d["ac4-khong-ca-hai"].ly_do, "thieu-dt-va-pn");
  assert.equal(d["ac4-ngoai-khoang"].ly_do, "ngoai-khoang");
  assert.equal(d["ac4-room-0"].ly_do, "nhom-5-9", "loại room của thuê chấm như mọi loại khác (5 phiếu)");
  await xepHangGia(c, { log: im.log, sql: dot(...DOT_BO_KIND) });
  const loi = kiemAc4(await dongs(c), fx);
  assert.ok(loi.some((x) => x.startsWith("ac4-m2-") && x.includes("n=16 ≠ 10")), `đột biến bỏ kind phải đỏ (lẫn tin bán); lỗi: ${loi.join(" | ")}`);
});

// ---------- AC-5: chạy lại, lỗi giữa chừng, số dòng, migration ----------
test("CG9-AC-5 chạy lại giống hệt; lỗi sau khi xoá giữ bảng cũ; một dòng mỗi tin; tin nghỉ rời bảng; 104 áp hai lần; CHECK cap", async () => {
  const c = await dbCa();
  await fixtureAc1(c);
  await fixtureAc4(c);
  await xepHangGia(c, { log: im.log, runId: "lan-1" });
  const bo = (rows) => rows.map(({ computed_at, run_id, ...r }) => r);
  const lan1 = bo((await c.query(`SELECT * FROM offer_price_rank ORDER BY offer_id`)).rows);
  await xepHangGia(c, { log: im.log, runId: "lan-2" });
  const lan2 = bo((await c.query(`SELECT * FROM offer_price_rank ORDER BY offer_id`)).rows);
  assert.deepEqual(lan2, lan1, "chạy lại không đổi dòng nào");
  const { rows: [dem] } = await c.query(`SELECT (SELECT count(*) FROM offer_price_rank)::int AS bang, (SELECT count(*) FROM sale_offers)::int AS tin`);
  assert.equal(dem.bang, dem.tin, "một dòng mỗi tin đang rao");
  await assert.rejects(xepHangGia(c, { log: im.log, sauXoa: async () => { throw new Error("đột biến: lỗi sau khi xoá"); } }), /đột biến/);
  const { rows: [sau] } = await c.query(`SELECT count(*)::int AS n, min(run_id) AS run FROM offer_price_rank`);
  assert.equal(sau.n, dem.bang, "lỗi giữa chừng: bảng cũ còn đủ dòng");
  assert.equal(sau.run, "lan-2");
  // Review Focus 2: tin nghỉ giữa hai lượt rời bảng.
  await c.query(`UPDATE sale_offer_records SET retired_at = now(), retired_reason = 'het_trong_luot' WHERE offer_id = 'ac1-apartment-11'`);
  await xepHangGia(c, { log: im.log });
  assert.equal((await c.query(`SELECT 1 FROM offer_price_rank WHERE offer_id = 'ac1-apartment-11'`)).rowCount, 0, "tin nghỉ không còn dòng");
  await c.query(readFileSync(MIG, "utf8"));
  await c.query(readFileSync(MIG, "utf8"));
  for (const cap of ["phuong", "du_an", "phan_khu", "toa"]) {
    await c.query(`UPDATE offer_price_rank SET cap = $1 WHERE offer_id = 'ac1-apartment-0'`, [cap]);
  }
  await assert.rejects(c.query(`UPDATE offer_price_rank SET cap = 'quan' WHERE offer_id = 'ac1-apartment-0'`), (e) => e.code === "23514");
});

test("CG9-AC-5 hai lượt chạy chồng xếp hàng theo khoá, không dòng trùng", async () => {
  const c = await dbCa();
  await fixtureAc1(c);
  const ten = moi.at(-1).ten;
  const c2 = new pg.Client({ connectionString: `${MAY_CHU}/${ten}` });
  await c2.connect();
  try {
    await Promise.all([xepHangGia(c, { log: im.log }), xepHangGia(c2, { log: im.log })]);
  } finally { await c2.end(); }
  const { rows: [dem] } = await c.query(`SELECT (SELECT count(*) FROM offer_price_rank)::int AS bang, (SELECT count(*) FROM sale_offers)::int AS tin`);
  assert.equal(dem.bang, dem.tin);
});

// ---------- AC-11: job đêm ----------
/** Tên bước theo thứ tự từ các dòng job_run/buoc của một script đêm. */
export function thuTuBuoc(noiDung) {
  return noiDung.split("\n").map((l) => l.match(/^\s*(?:job_run|buoc)\s+\S+\s+(\S+)\s/)?.[1]).filter(Boolean);
}
const JOB = [
  ["scripts/chotot-daily.sh", "resolve-properties"],
  ["scripts/zalo-import-daily.sh", "refresh-bait-gap"],
  ["scripts/apify-facebook-daily.sh", "refresh-bait-gap"],
];
function kiemJob(ten, noiDung, sauBuoc) {
  const b = thuTuBuoc(noiDung);
  const vi = b.filter((x) => x === "xep-hang-gia");
  if (vi.length !== 1) return `${ten}: có ${vi.length} bước xep-hang-gia`;
  if (b.indexOf("xep-hang-gia") < b.lastIndexOf(sauBuoc)) return `${ten}: xep-hang-gia đứng trước ${sauBuoc}`;
  return null;
}
test("CG9-AC-11 ba job đêm có đúng một bước xep-hang-gia sau bước định vị; đột biến bỏ bước hay đặt trước đỏ", () => {
  for (const [tep, sau] of JOB) {
    const nd = readFileSync(join(GOC, tep), "utf8");
    assert.equal(kiemJob(tep, nd, sau), null);
    const dong = nd.split("\n").find((l) => /xep-hang-gia/.test(l) && /^\s*(job_run|buoc)\s/.test(l));
    assert.match(kiemJob(tep, nd.replace(dong, ""), sau) ?? "", new RegExp(`${tep}: có 0 bước`), `bỏ bước ở ${tep} phải đỏ`);
    const dongSau = nd.split("\n").find((l) => new RegExp(`^\\s*(job_run|buoc)\\s+\\S+\\s+${sau}\\s`).test(l));
    const daoNguoc = nd.replace(dong, "__X__").replace(dongSau, `${dong}\n${dongSau}`).replace("__X__", "");
    assert.match(kiemJob(tep, daoNguoc, sau) ?? "", new RegExp(`${tep}: xep-hang-gia đứng trước ${sau}`), `đặt trước ở ${tep} phải đỏ`);
  }
});
test("CG9-AC-11 DB chưa áp 104: thoát êm, đúng dòng «chưa áp 104», không ghi; DB có 104: run_id mới", async () => {
  const c = await dbCa("mau103");
  const log = [];
  const kq = await xepHangGia(c, { log: (s) => log.push(s) });
  assert.equal(kq.chuaAp104, true);
  assert.ok(log.some((s) => s.includes("chưa áp 104")), `log: ${log.join(" | ")}`);
  assert.equal((await c.query(`SELECT to_regclass('offer_price_rank') AS t`)).rows[0].t, null);
  const c2 = await dbCa();
  await fixtureAc1(c2);
  await xepHangGia(c2, { log: im.log, runId: "cu" });
  const kq2 = await xepHangGia(c2, { log: im.log });
  const { rows: [r] } = await c2.query(`SELECT DISTINCT run_id FROM offer_price_rank`);
  assert.equal(r.run_id, kq2.runId);
  assert.notEqual(r.run_id, "cu");
});
