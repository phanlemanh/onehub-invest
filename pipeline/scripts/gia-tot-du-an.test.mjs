// gia-tot-du-an.test.mjs — phép đo CG10 gia-tot-cap-du-an (_acceptance/gia-tot-cap-du-an): hạ tầng, AC-1…AC-5.
// Mỗi ca chạy trên DB thử trắng từ db/migrations của nhánh (gia-tot-du-an-fixture.itest.mjs); số kỳ vọng tính độc lập bằng
// kyVong() — không gọi mã của hàng. Chiều đỏ: thay đúng một chuỗi trong SQL_420 rồi chấm lại trên cùng fixture.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";

import { dbCa, donHet, dungMau, tin } from "./gia-tot-du-an-fixture.itest.mjs";
import { duAn } from "./gia-tot-du-an-fixture.itest.mjs";

before(dungMau);
after(donHet);

// ---------- hạ tầng ----------
test("CG10-HT-1 view offer_project tạm và bảng 106 có trong DB thử; đối chứng bỏ view, bỏ 106", async () => {
  const c = await dbCa();
  const d = await duAn(c);
  await tin(c, { id: "ht-1", duAn: d, m2: 50, perm2: 50_000_000 });
  const { rows } = await c.query(`SELECT project_node_id, status FROM offer_project WHERE offer_id = 'ht-1'`);
  assert.deepEqual(rows.map((r) => [Number(r.project_node_id), r.status]), [[d, "mot_du_an"]], "CG10-HT-1 view không quy tin về dự án");
  assert.ok((await c.query(`SELECT to_regclass('project_area_band') AS t`)).rows[0].t, "CG10-HT-1 thiếu bảng 106");

  const c2 = await dbCa({ view: false, bo106: true });
  const r2 = (await c2.query(`SELECT to_regclass('offer_project') AS v, to_regclass('project_area_band') AS b`)).rows[0];
  assert.equal(r2.v, null, "CG10-HT-1 đối chứng: bỏ view mà view vẫn có");
  assert.equal(r2.b, null, "CG10-HT-1 đối chứng: bỏ 106 mà bảng vẫn có");
});

// ---------- dùng chung ----------
import { SQL_420, SQL_420_DU_AN, xepHangGia } from "../xep-hang-gia.mjs";
import { A, M, can, dongs, kyVong, pct, so, soDong } from "./gia-tot-du-an-fixture.itest.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { GOC } from "./db-thu-dbv.mjs";

const im = { log: () => {} };
/** Bản 422 đột biến: thay từng cặp chuỗi, chuỗi phải có mặt. */
function dot(...cap) {
  let s = SQL_420_DU_AN;
  for (const [cu, moiChuoi] of cap) {
    assert.ok(s.includes(cu), `đột biến rỗng: không thấy «${cu.slice(0, 70)}» trong 422`);
    s = s.split(cu).join(moiChuoi);
  }
  return s;
}
const DOT_BO_5 = ["AND round((1 - so.gia_tri / so.trung_vi::numeric) * 100, 1) >= 5\n            THEN", "\n            THEN"];
const DOT_THEO_PHUONG = ["CASE WHEN op.status = 'mot_du_an' THEN op.project_node_id END AS pj",
  "CASE WHEN op.status = 'mot_du_an' THEN abs(hashtext(o.area_id))::bigint END AS pj"];
const DOT_NHAN_PHUONG = ["THEN CASE WHEN so.du_an THEN 'gia-tot' ELSE 're-trong-phuong' END END",
  "THEN CASE WHEN so.du_an THEN 're-trong-phuong' ELSE 're-trong-phuong' END END"];
const DOT_BO_PN_DTH = ["'dth|' || l.pj || '|' || l.property_type || '|' || l.bedrooms", "'dth|' || l.pj || '|' || l.property_type"];

// ---------- AC-1: cấp dự án, dự án trải hai phường ----------
const BAN_2PN = [40, 42, 44, 46, 48, 50, 52, 54, 56, 58].map((x) => x * M);   // 10 phiếu 2PN
const BAN_1PN = [45, 60].map((x) => x * M);                                   // 2 phiếu 1PN → lùi dall
const NHA_SAT = [49, 49.5, 50, 50, 50, 50, 50, 50, 51, 51, 52, 52].map((x) => x * M); // ≤ p20 mà < 5%
const THUE_M2 = [200, 210, 220, 230, 240, 250, 260, 270, 280, 290].map((x) => x * 1000);
async function fixtureAc1(c) {
  const d = await duAn(c, { ten: "Khu thử Một" });
  for (const [i, v] of BAN_2PN.entries()) await tin(c, { id: `ac1-2pn-${i}`, duAn: d, phuong: A(i % 2 ? "a1" : "a2"), m2: 60, pn: 2, perm2: v });
  for (const [i, v] of BAN_1PN.entries()) await tin(c, { id: `ac1-1pn-${i}`, duAn: d, phuong: A("a1"), m2: 45, pn: 1, perm2: v });
  for (const [i, v] of NHA_SAT.entries()) await tin(c, { id: `ac1-nha-${i}`, duAn: d, loai: "house", phuong: A(i % 2 ? "a1" : "a2"), m2: 80, perm2: v });
  for (const [i, v] of THUE_M2.entries()) await tin(c, { id: `ac1-thue-${i}`, duAn: d, kind: "rent_lt", phuong: A("a1"), m2: 60, perm2: v });
  return d;
}
function kiemAc1(dg, d) {
  const loi = [];
  const ca = (id, kv, v, them = {}) => {
    const r = dg[id];
    loi.push(...soDong(r, kv.cua(v), id));
    if (r?.cap !== "du_an") loi.push(`${id}: cap=${r?.cap} ≠ du_an`);
    if (r?.nut !== String(d)) loi.push(`${id}: nut=${r?.nut} ≠ ${d}`);
    for (const [k, gt] of Object.entries(them)) if ((r?.[k] ?? null) !== gt) loi.push(`${id}: ${k}=${r?.[k]} ≠ ${gt}`);
  };
  const kv2 = kyVong(BAN_2PN);
  BAN_2PN.forEach((v, i) => ca(`ac1-2pn-${i}`, kv2, v, { pn_nhom: 2, ly_do: null }));
  const kvAll = kyVong([...BAN_2PN, ...BAN_1PN]);
  BAN_1PN.forEach((v, i) => ca(`ac1-1pn-${i}`, kvAll, v, { pn_nhom: null, ly_do: "pn-duoi-10" }));
  const kvNha = kyVong(NHA_SAT);
  NHA_SAT.forEach((v, i) => ca(`ac1-nha-${i}`, kvNha, v));
  const kvThue = kyVong(THUE_M2);
  THUE_M2.forEach((v, i) => ca(`ac1-thue-${i}`, kvThue, v, { kind: "rent_lt", thuoc: "gia-m2" }));
  return loi;
}
test("CG10-AC-1 cấp dự án gom hai phường: số, nhãn gia-tot, chia/lùi PN, thuê tách bán; ba đột biến đỏ", async () => {
  const c = await dbCa();
  const d = await fixtureAc1(c);
  await xepHangGia(c, im);
  const loi = kiemAc1(await dongs(c), d);
  assert.deepEqual(loi, [], `CG10-AC-1:\n${loi.join("\n")}`);
  assert.ok(Object.values(await dongs(c)).some((r) => r.nhan === "gia-tot"), "CG10-AC-1 đối chứng dương: không tin nào mang gia-tot");
  for (const [ten, cap] of [["bỏ điều kiện 5%", [DOT_BO_5]], ["nhóm theo phường", [DOT_THEO_PHUONG]], ["nhãn phường ở cấp dự án", [DOT_NHAN_PHUONG]]]) {
    await xepHangGia(c, { ...im, sql: dot(...cap) });
    const loiDot = kiemAc1(await dongs(c), d);
    assert.ok(loiDot.length > 0 && loiDot.every((x) => /^ac1-/.test(x)), `CG10-AC-1 đột biến «${ten}» không đỏ (hay đỏ không nêu mã tin)`);
  }
});

// ---------- AC-2: chuỗi lùi cấp ----------
test("CG10-AC-2 ma trận lùi cấp: <5, 5–9 với phường đủ/thiếu, xung đột, không dự án, dự án con, thiếu loại, bán thiếu m², căn ở hai dự án", async () => {
  const c = await dbCa();
  // đối chứng dương: dự án ≥ 10 ở a1
  const dLon = await duAn(c);
  for (let i = 0; i < 10; i++) await tin(c, { id: `ac2-lon-${i}`, duAn: dLon, phuong: A("a1"), m2: 60, perm2: (40 + i) * M });
  // a. dự án < 5 ở a3 (phường a3 chỉ có chúng)
  const d4 = await duAn(c);
  for (let i = 0; i < 4; i++) await tin(c, { id: `ac2-d4-${i}`, duAn: d4, phuong: A("a3"), m2: 60, perm2: (40 + i) * M });
  // b. dự án 5–9 ở a4, phường a4 đủ 10 nhờ 6 tin không dự án
  const d6a = await duAn(c);
  const giaA4 = [40, 41, 42, 43, 44, 45, 60, 61, 62, 63, 64, 65].map((x) => x * M);
  for (let i = 0; i < 6; i++) await tin(c, { id: `ac2-d6a-${i}`, duAn: d6a, phuong: A("a4"), m2: 60, perm2: giaA4[i] });
  for (let i = 6; i < 12; i++) await tin(c, { id: `ac2-ngoai-${i}`, phuong: A("a4"), m2: 60, perm2: giaA4[i] });
  // c. dự án 5–9 ở a5, phường a5 dưới 10
  const d6b = await duAn(c);
  const giaA5 = [40, 42, 44, 46, 48, 50].map((x) => x * M);
  for (let i = 0; i < 6; i++) await tin(c, { id: `ac2-d6b-${i}`, duAn: d6b, phuong: A("a5"), m2: 60, perm2: giaA5[i] });
  // d. xung đột: bài một dự án dLon, bài hai dự án d6b
  await tin(c, { id: "ac2-xd", duAn: [dLon, d6b], phuong: A("a1"), m2: 60, perm2: 45 * M });
  // f. dự án con 10 tin, cha là dLon
  const con = await duAn(c, { cha: dLon });
  for (let i = 0; i < 10; i++) await tin(c, { id: `ac2-con-${i}`, duAn: con, phuong: A("a2"), m2: 70, perm2: (50 + i) * M });
  // g. thiếu loại; h. bán thiếu m²
  await tin(c, { id: "ac2-loai", duAn: dLon, loai: null, phuong: A("a1"), m2: 60, perm2: 45 * M });
  await tin(c, { id: "ac2-m2", duAn: dLon, phuong: A("a1"), pn: 2, gia: 3_000_000_000 });
  // i. căn S06 ở hai dự án: x thuộc dLon, y thuộc con, cùng một căn
  await tin(c, { id: "ac2-x", duAn: dLon, phuong: A("a1"), m2: 60, perm2: 47 * M });
  await tin(c, { id: "ac2-y", duAn: con, phuong: A("a2"), m2: 70, perm2: 55 * M });
  await can(c, ["ac2-x", "ac2-y"]);
  await xepHangGia(c, im);
  const d = await dongs(c);
  const loi = [];
  const ky = (id, dk, msg) => { if (!dk(d[id])) loi.push(`${id}: ${msg} (cap=${d[id]?.cap} nut=${d[id]?.nut} n=${d[id]?.n} nhan=${d[id]?.nhan} ly_do=${d[id]?.ly_do})`); };
  ky("ac2-lon-0", (r) => r?.cap === "du_an" && r.nut === String(dLon), "đối chứng dương: dự án ≥ 10 phải cap du_an");
  ky("ac2-d4-0", (r) => r?.cap === "phuong" && r.ly_do === "nhom-duoi-5", "dự án < 5 phải theo chuỗi phường");
  const kvA4 = kyVong(giaA4, "re-trong-phuong");
  for (let i = 0; i < 6; i++) {
    ky(`ac2-d6a-${i}`, (r) => r?.cap === "phuong" && r.nut === A("a4") && so(r.n) === 12 && (r.nhan ?? null) === kvA4.cua(giaA4[i]).nhan,
      "dự án 5–9 + phường ≥ 10 phải lùi phường, nhãn theo phường");
  }
  for (let i = 0; i < 6; i++) ky(`ac2-d6b-${i}`, (r) => r?.cap === "du_an" && so(r.n) === 6 && r.nhan == null && r.ly_do === "nhom-5-9",
    "dự án 5–9 + phường < 10 phải cap du_an, nhom-5-9, không nhãn");
  ky("ac2-xd", (r) => r?.cap === "phuong", "xung đột phải theo phường");
  ky("ac2-ngoai-6", (r) => r?.cap === "phuong", "không dự án phải theo phường");
  ky("ac2-con-0", (r) => r?.cap === "du_an" && r.nut === String(con), "dự án con phải nhóm theo nút con");
  ky("ac2-loai", (r) => r?.ly_do === "chua-ro-loai" && r.hang_pct == null, "thiếu loại phải chua-ro-loai");
  ky("ac2-m2", (r) => r?.ly_do === "thieu-gia" && r.hang_pct == null, "bán thiếu m² phải thieu-gia (không chia giá cho m² suy ra)");
  ky("ac2-x", (r) => r?.cap === "du_an" && r.nut === String(dLon) && so(r.n) === 11, "căn ở hai dự án: dự án cha đếm căn đúng một lần (10 + 1)");
  ky("ac2-y", (r) => r?.cap === "du_an" && r.nut === String(con) && so(r.n) === 11, "căn ở hai dự án: dự án con đếm căn đúng một lần (10 + 1)");
  assert.deepEqual(loi, [], `CG10-AC-2:\n${loi.join("\n")}`);
});

// ---------- AC-3: thuê thiếu m² theo giá tháng × PN cấp dự án ----------
const THANG_2PN = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19].map((x) => x * M);
test("CG10-AC-3 thuê thiếu m²: 2PN theo giá tháng nhóm dự án, 1PN 5–9 lùi, thiếu cả hai; đột biến bỏ PN đỏ", async () => {
  const c = await dbCa();
  const d = await duAn(c);
  async function dung(c2) {
    for (const [i, v] of THANG_2PN.entries()) await tin(c2, { id: `ac3-2pn-${i}`, duAn: d, kind: "rent_lt", phuong: A(i % 2 ? "a1" : "a2"), pn: 2, gia: v });
    for (let i = 0; i < 6; i++) await tin(c2, { id: `ac3-1pn-${i}`, duAn: d, kind: "rent_lt", phuong: A("a3"), pn: 1, gia: (7 + i) * M });
    await tin(c2, { id: "ac3-trong", duAn: d, kind: "rent_lt", phuong: A("a1"), gia: 9 * M });
  }
  await dung(c);
  const kiem = (dg) => {
    const loi = [];
    const kv = kyVong(THANG_2PN);
    THANG_2PN.forEach((v, i) => {
      const id = `ac3-2pn-${i}`, r = dg[id];
      loi.push(...soDong(r, kv.cua(v), id));
      if (r?.cap !== "du_an" || r?.thuoc !== "gia-thang-pn" || so(r?.pn_nhom) !== 2) loi.push(`${id}: cap=${r?.cap} thuoc=${r?.thuoc} pn_nhom=${r?.pn_nhom}`);
    });
    for (let i = 0; i < 6; i++) {
      const r = dg[`ac3-1pn-${i}`];
      if (!(r?.cap === "du_an" && so(r.n) === 6 && r.ly_do === "nhom-5-9")) loi.push(`ac3-1pn-${i}: cap=${r?.cap} n=${r?.n} ly_do=${r?.ly_do}`);
    }
    if (dg["ac3-trong"]?.ly_do !== "thieu-dt-va-pn") loi.push(`ac3-trong: ly_do=${dg["ac3-trong"]?.ly_do}`);
    return loi;
  };
  await xepHangGia(c, im);
  const loi = kiem(await dongs(c));
  assert.deepEqual(loi, [], `CG10-AC-3:\n${loi.join("\n")}`);
  await xepHangGia(c, { ...im, sql: dot(DOT_BO_PN_DTH) });
  const loiDot = kiem(await dongs(c));
  assert.ok(loiDot.some((x) => /^ac3-2pn-/.test(x)), "CG10-AC-3 đột biến bỏ PN khỏi nhóm giá tháng không đỏ");
});

// ---------- AC-4: môi trường thiếu view, view ngoài public, chưa 106, chạy lại, tin rời dự án ----------
const boDong = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "computed_at" && k !== "run_id"));
async function fixtureNho(c) {
  const d = await duAn(c);
  for (let i = 0; i < 10; i++) await tin(c, { id: `ac4-${i}`, duAn: d, phuong: A("a1"), m2: 60, pn: 2, perm2: (40 + i) * M });
  for (let i = 0; i < 10; i++) await tin(c, { id: `ac4-ngoai-${i}`, phuong: A("a2"), m2: 60, pn: 2, perm2: (40 + i) * M });
  return d;
}
test("CG10-AC-4 không view: chỉ phường bằng 420; view ngoài public dò thấy; chưa 106 bỏ dải; chạy lại giống hệt; tin rời dự án về phường", async () => {
  // không view
  const c1 = await dbCa({ view: false });
  await fixtureNho(c1);
  const dongIn = [];
  await xepHangGia(c1, { log: (s) => dongIn.push(s) });
  assert.ok(dongIn.includes("xep-hang-gia: chưa có offer_project — chỉ chấm cấp phường"), `CG10-AC-4 thiếu dòng báo: ${dongIn.join(" | ")}`);
  const a = await dongs(c1);
  assert.ok(Object.values(a).every((r) => r.cap !== "du_an"), "CG10-AC-4 không view mà có dòng du_an");
  await xepHangGia(c1, { ...im, sql: SQL_420 });
  const b = await dongs(c1);
  assert.deepEqual(Object.fromEntries(Object.entries(a).map(([k, r]) => [k, boDong(r)])),
    Object.fromEntries(Object.entries(b).map(([k, r]) => [k, boDong(r)])), "CG10-AC-4 không view: kết quả khác câu CG9 (420)");
  // view ngoài public, có trong search_path
  const c2 = await dbCa({ luocDoView: "cg10_view" });
  await fixtureNho(c2);
  await xepHangGia(c2, im);
  assert.equal((await dongs(c2))["ac4-0"]?.cap, "du_an", "CG10-AC-4 view ngoài public không được dò thấy");
  await xepHangGia(c2, { ...im, tenView: "public.offer_project" });
  assert.notEqual((await dongs(c2))["ac4-0"]?.cap, "du_an", "CG10-AC-4 đột biến dò public.offer_project không đỏ");
  // có view, chưa 106
  const c3 = await dbCa({ bo106: true });
  await fixtureNho(c3);
  const in3 = [];
  const kq3 = await xepHangGia(c3, { log: (s) => in3.push(s) });
  assert.ok(in3.includes("xep-hang-gia: chưa áp 106 — bỏ dải diện tích"), `CG10-AC-4 thiếu dòng chưa áp 106: ${in3.join(" | ")}`);
  assert.equal(kq3.dai, null);
  assert.equal((await dongs(c3))["ac4-0"]?.cap, "du_an", "CG10-AC-4 chưa 106 mà mất cấp dự án");
  await assert.rejects(() => xepHangGia(c3, { ...im, boDo106: true }), /project_area_band/, "CG10-AC-4 đột biến chèn dải không dò bảng không đỏ");
  assert.equal((await dongs(c3))["ac4-0"]?.cap, "du_an", "CG10-AC-4 lỗi giữa chừng làm mất bảng cũ");
  // chạy lại giống hệt, tin rời dự án
  const c4 = await dbCa();
  await fixtureNho(c4);
  await xepHangGia(c4, im);
  const l1 = await dongs(c4);
  await xepHangGia(c4, im);
  const l2 = await dongs(c4);
  assert.deepEqual(Object.fromEntries(Object.entries(l2).map(([k, r]) => [k, boDong(r)])),
    Object.fromEntries(Object.entries(l1).map(([k, r]) => [k, boDong(r)])), "CG10-AC-4 chạy lại khác lần đầu");
  await c4.query(`UPDATE field_assertions SET retracted_at = now(), retract_reason = 'thu' WHERE subject_key = 'S03:ac4-0-b0'`);
  await xepHangGia(c4, im);
  assert.equal((await dongs(c4))["ac4-0"]?.cap, "phuong", "CG10-AC-4 tin rời dự án mà vẫn cap du_an");
});

// ---------- AC-5: dải m² dự án × PN ----------
test("CG10-AC-5 dải m²: 2PN 12 mẫu ra p10/p50/p90, 1PN 7 mẫu không dòng, ngoài khoảng loại; không chảy vào giá; lỗi giữa chừng giữ cũ; 106 hai lần", async () => {
  const c = await dbCa();
  const d = await duAn(c);
  const M2 = [50, 52, 54, 55, 56, 58, 60, 61, 62, 64, 66, 70];
  for (const [i, m2] of M2.entries()) await tin(c, { id: `ac5-2pn-${i}`, duAn: d, phuong: A("a1"), m2, pn: 2, perm2: (40 + i) * M });
  for (let i = 0; i < 7; i++) await tin(c, { id: `ac5-1pn-${i}`, duAn: d, phuong: A("a1"), m2: 40 + i, pn: 1, perm2: (45 + i) * M });
  await tin(c, { id: "ac5-to", duAn: d, phuong: A("a1"), m2: 400, pn: 2, gia: 8_000_000_000 });
  await tin(c, { id: "ac5-thieu", duAn: d, phuong: A("a1"), pn: 2, gia: 3_000_000_000 });
  const ap106 = readFileSync(join(GOC, "db/migrations/106_project_area_band.sql"), "utf8");
  await c.query(ap106);
  await c.query(ap106);
  const kq = await xepHangGia(c, im);
  assert.equal(kq.dai, 1, "CG10-AC-5 số nhóm dải");
  const { rows } = await c.query(`SELECT * FROM project_area_band`);
  assert.equal(rows.length, 1);
  const s = [...M2].sort((x, y) => x - y);
  const gan = (a, b, ten) => assert.ok(Math.abs(Number(a) - b) <= 0.1, `CG10-AC-5 ${ten}=${a} ≠ ${b}`);
  assert.equal(Number(rows[0].project_node_id), d);
  assert.equal(rows[0].bedrooms, 2);
  assert.equal(rows[0].n, 12, "CG10-AC-5 n (tin m² 400 phải bị loại)");
  gan(rows[0].p10, pct(s, 0.1), "p10"); gan(rows[0].p50, pct(s, 0.5), "p50"); gan(rows[0].p90, pct(s, 0.9), "p90");
  // không chảy vào giá: area_m2 không đổi, hạng bằng lượt không có 106
  assert.equal((await c.query(`SELECT area_m2 FROM sale_offer_records WHERE offer_id = 'ac5-thieu'`)).rows[0].area_m2, null, "CG10-AC-5 dải ghi đè area_m2");
  const coDai = await dongs(c);
  await c.query(`DROP TABLE project_area_band`);
  await xepHangGia(c, im);
  const khongDai = await dongs(c);
  assert.deepEqual(Object.fromEntries(Object.entries(coDai).map(([k, r]) => [k, boDong(r)])),
    Object.fromEntries(Object.entries(khongDai).map(([k, r]) => [k, boDong(r)])), "CG10-AC-5 hạng đổi khi có dải — dải chảy vào giá");
  // đối chứng: nếu m² suy ra chảy vào tin thiếu m² thì hạng đổi (phép so phân biệt được)
  await c.query(`UPDATE sale_offer_records SET area_m2 = 58, price_perm2 = 3000000000 / 58 WHERE offer_id = 'ac5-thieu'`);
  await xepHangGia(c, im);
  assert.notDeepEqual(boDong((await dongs(c))["ac5-thieu"]), boDong(khongDai["ac5-thieu"]), "CG10-AC-5 đối chứng: dùng p50 làm m² mà hạng không đổi");
  // lỗi giữa chừng giữ cả hai bảng
  await c.query(ap106);
  await c.query(`UPDATE sale_offer_records SET area_m2 = NULL, price_perm2 = NULL WHERE offer_id = 'ac5-thieu'`);
  await xepHangGia(c, im);
  const truoc = (await c.query(`SELECT count(*)::int n FROM project_area_band`)).rows[0].n;
  await assert.rejects(() => xepHangGia(c, { ...im, sauXoa: async () => { throw new Error("lỗi thử sau xoá"); } }), /lỗi thử/);
  assert.equal((await c.query(`SELECT count(*)::int n FROM project_area_band`)).rows[0].n, truoc, "CG10-AC-5 lỗi giữa chừng mất dải cũ");
  assert.ok(Object.keys(await dongs(c)).length > 0, "CG10-AC-5 lỗi giữa chừng mất hạng cũ");
});

// ---------- AC-8 (phần pipeline): đồng bộ cloud chép dòng cấp dự án theo luật có sẵn; dải m² không lên cloud ----------
import { FILL, childFilterSql, selectList } from "../sync-cloud.mjs";
test("CG10-AC-8 sync-cloud (không sửa) chọn đúng các dòng cap=du_an của tin sống; project_area_band không trong FILL", async () => {
  const c = await dbCa();
  await fixtureAc1(c);
  await tin(c, { id: "ac8-nghi", duAn: (await duAn(c)), phuong: A("a4"), m2: 60, perm2: 40 * M });
  await xepHangGia(c, im);
  await c.query(`UPDATE sale_offer_records SET retired_at = now() WHERE offer_id = 'ac1-2pn-0'`); // tin rút: sync không chép
  const chon = (await c.query(`SELECT count(*)::int n FROM offer_price_rank${childFilterSql("offer_price_rank")} AND cap = 'du_an'`)).rows[0].n;
  const docLap = (await c.query(`SELECT count(*)::int n FROM offer_price_rank h JOIN sale_offer_records r USING (offer_id)
                                   WHERE r.retired_at IS NULL AND h.cap = 'du_an'`)).rows[0].n;
  assert.ok(docLap > 30, `đối chứng: phải có dòng cấp dự án (${docLap})`);
  assert.equal(chon, docLap, "CG10-AC-8 sync chọn số dòng cấp dự án khác đếm độc lập");
  assert.ok(selectList("offer_price_rank", ["cap", "nut", "nhan"]).cols.includes("nut"), "cột nut phải lên cloud");
  assert.ok(!FILL.includes("project_area_band"), "CG10-AC-8 project_area_band không được sync (cloud đi sau)");
});
