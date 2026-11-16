// do-lech-s03-s06.test.mjs — phép đo CG15 do-lech-s03-s06-canh-hang (_acceptance/do-lech-s03-s06-canh-hang): hạ tầng, AC-1…AC-4.
// Mỗi ca chạy trên DB thử trắng từ db/migrations của nhánh (gia-tot-du-an-fixture.itest.mjs, có 105, 106, 107); số kỳ vọng tính
// độc lập trong test — không gọi mã của hàng. Chiều đỏ: thay đúng một chuỗi trong SQL_423 rồi chấm lại trên cùng fixture.
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { A, M, can, dbCa, dongs, donHet, dungMau, duAn, pct, so, tin, tinS06 } from "./gia-tot-du-an-fixture.itest.mjs";
import { GOC } from "./db-thu-dbv.mjs";
import { SQL_423, xepHangGia } from "../xep-hang-gia.mjs";

before(dungMau);
after(donHet);

const im = { log: () => {} };
const matBang = async (c) => (await c.query(`SELECT * FROM project_source_baseline ORDER BY nut, kind, thuoc, pn_nhom`)).rows;
const khoa = (r) => `${r.nut}|${r.kind}|${r.property_type}|${r.thuoc}|${r.pn_nhom ?? "-"}`;
const trungVi = (xs) => (xs.length ? pct([...xs].sort((a, b) => a - b), 0.5) : null);
const gan = (a, b) => (a == null && b == null) || (a != null && b != null && Math.abs(Number(a) - b) <= 0.1 + 1e-9 * Math.abs(b));

/** So một dòng mặt bằng với kỳ vọng tính độc lập; ném lỗi nêu khoá nhóm. */
function kiemDong(r, kv, ten) {
  const loi = [];
  if (!r) throw new Error(`${ten}: không có dòng mặt bằng`);
  const k = khoa(r);
  if (so(r.n_s03) !== kv.n3) loi.push(`n_s03=${r.n_s03} ≠ ${kv.n3}`);
  if (so(r.n_s06) !== kv.n6) loi.push(`n_s06=${r.n_s06} ≠ ${kv.n6}`);
  if (!gan(r.trung_vi_s03, kv.tv3)) loi.push(`trung_vi_s03=${r.trung_vi_s03} ≠ ${kv.tv3}`);
  if (!gan(r.trung_vi_s06, kv.tv6)) loi.push(`trung_vi_s06=${r.trung_vi_s06} ≠ ${kv.tv6}`);
  const lech = kv.n3 >= 5 && kv.n6 >= 5 ? Math.round((kv.tv3 / kv.tv6 - 1) * 1000) / 10 : null;
  if (!gan(r.lech_pct, lech)) loi.push(`lech_pct=${r.lech_pct} ≠ ${lech}`);
  if (kv.trangThai && r.trang_thai !== kv.trangThai) loi.push(`trang_thai=${r.trang_thai} ≠ ${kv.trangThai}`);
  if (loi.length) throw new Error(`${ten} [${k}]: ${loi.join("; ")}`);
}

// ---------- hạ tầng ----------
test("CG15-HT-1 bảng 107 có trong DB thử; đối chứng bỏ 107", async () => {
  const c = await dbCa();
  assert.ok((await c.query(`SELECT to_regclass('project_source_baseline') AS t`)).rows[0].t, "CG15-HT-1 thiếu bảng 107");
  const c2 = await dbCa({ bo107: true });
  assert.equal((await c2.query(`SELECT to_regclass('project_source_baseline') AS t`)).rows[0].t, null, "CG15-HT-1 đối chứng: bỏ 107 mà bảng vẫn có");
});

// ---------- AC-1 ----------
/** Dự án một phường: bán căn hộ 2PN — 7 phiếu S03 (hai tin trùng giá), 9 phiếu S06 (một căn hai tin), 1 tin S05. */
async function fixtureAc1(c) {
  const d = await duAn(c);
  const s03 = [50, 52, 52, 55, 58, 60, 63].map((x) => x * M);
  for (const [i, v] of s03.entries()) await tin(c, { id: `ac1-s03-${i}`, duAn: d, m2: 60, pn: 2, perm2: v });
  const s06 = [54, 56, 57, 59, 61, 62, 64, 66].map((x) => x * M);
  for (const [i, v] of s06.entries()) await tinS06(c, { id: `ac1-s06-${i}`, duAn: d, m2: 60, pn: 2, perm2: v });
  // căn hai tin: tin thấy sau (70) là đại diện của phiếu
  await tinS06(c, { id: "ac1-s06-can-a", duAn: d, m2: 60, pn: 2, perm2: 40 * M });
  await tinS06(c, { id: "ac1-s06-can-b", duAn: d, m2: 60, pn: 2, perm2: 70 * M });
  await can(c, ["ac1-s06-can-a", "ac1-s06-can-b"]);
  await tin(c, { id: "ac1-s05", nguon: "S05", duAn: d, m2: 60, pn: 2, perm2: 30 * M });
  return { d, kv: { n3: 7, n6: 9, tv3: trungVi(s03), tv6: trungVi([...s06, 70 * M]), trangThai: "du" } };
}
async function kiemAc1(c, d, kv) {
  const rows = (await matBang(c)).filter((r) => r.nut === String(d) && r.kind === "sale" && r.thuoc === "gia-m2");
  assert.equal(rows.length, 1, `CG15-AC-1 nhóm bán của dự án có ${rows.length} dòng, cần 1: ${rows.map(khoa).join(", ")}`);
  assert.equal(so(rows[0].pn_nhom), 2, `CG15-AC-1 [${khoa(rows[0])}] pn_nhom ≠ 2`);
  kiemDong(rows[0], kv, "CG15-AC-1");
}
const dot = (...cap) => {
  let s = SQL_423;
  for (const [cu, moi] of cap) {
    assert.ok(s.includes(cu), `đột biến rỗng: không thấy «${cu.slice(0, 70)}» trong 423`);
    s = s.split(cu).join(moi);
  }
  return s;
};
test("CG15-AC-1 nhóm đủ hai bên: đếm phiếu, trung vị từng nguồn, độ lệch; ba đột biến đỏ", async () => {
  const c = await dbCa();
  const { d, kv } = await fixtureAc1(c);
  await xepHangGia(c, im);
  await kiemAc1(c, d, kv);
  const DOT = [
    ["đếm theo tin", [["coalesce((SELECT 'p:' || min(po.property_id) FROM property_offers po WHERE po.offer_id = o.offer_id),\n                  'o:' || o.offer_id) AS phieu", "'o:' || o.offer_id AS phieu"]]],
    ["S05 lẫn vào bên S03", [["AND o.source IN ('S03', 'S06')", ""], ["FILTER (WHERE source = 'S03')", "FILTER (WHERE source <> 'S06')"]]],
    ["đảo dấu", [["(tv3 / NULLIF(tv6, 0) - 1)", "(tv6 / NULLIF(tv3, 0) - 1)"]]],
  ];
  for (const [ten, cap] of DOT) {
    await xepHangGia(c, { ...im, sql423: dot(...cap) });
    await assert.rejects(kiemAc1(c, d, kv), new RegExp(`CG15-AC-1 \\[${d}\\|sale`), `CG15-AC-1 đột biến «${ten}» không đỏ`);
  }
});

// ---------- AC-2 ----------
test("CG15-AC-2 ma trận thiếu bên, nguồn khác, cấp phường, tin loại ra", async () => {
  const c = await dbCa();
  const nhom = async (phuong, n3, n6, extra = async () => {}) => {
    const d = await duAn(c);
    const v3 = [], v6 = [];
    for (let i = 0; i < n3; i++) { const v = (50 + i) * M; v3.push(v); await tin(c, { id: `ac2-${d}-s03-${i}`, duAn: d, phuong: A(phuong), m2: 60, pn: 2, perm2: v }); }
    for (let i = 0; i < n6; i++) { const v = (55 + i) * M; v6.push(v); await tinS06(c, { id: `ac2-${d}-s06-${i}`, duAn: d, phuong: A(phuong), m2: 60, pn: 2, perm2: v }); }
    await extra(d);
    return { d, v3, v6 };
  };
  // a) S03 4 + S06 6, thêm một tin S03 phi lý (30 m² 3PN) không vào mẫu
  const a = await nhom("a1", 4, 6, (d) => tin(c, { id: `ac2-phily`, duAn: d, phuong: A("a1"), m2: 30, pn: 3, perm2: 45 * M }));
  const b = await nhom("a2", 6, 4);                // b) S03 6 + S06 4
  const ch = await nhom("a3", 3, 3);               // c) cả hai dưới 5 (nhóm 6 phiếu, phường dưới 10 → du_an nhom-5-9)
  const dd = await nhom("a4", 0, 6);               // d) chỉ S06
  // e) S03 5 + S06 5 + S05 2 + căn S06 có ghép một tin S03 (một phiếu cho mỗi nguồn) — đối chứng dương: có lech_pct
  const e = await nhom("a5", 5, 5, async (d) => {
    for (let i = 0; i < 2; i++) await tin(c, { id: `ac2-s05-${i}`, nguon: "S05", duAn: d, phuong: A("a5"), m2: 60, pn: 2, perm2: 20 * M });
    // S02 cùng phường, có phát biểu dự án trên bài: view 105 không nhận nguồn S02 nên tin không lên cấp dự án, không vào n
    for (let i = 0; i < 2; i++) await tin(c, { id: `ac2-s02-${i}`, nguon: "S02", duAn: d, phuong: A("a5"), m2: 60, pn: 2, perm2: 21 * M });
    await tinS06(c, { id: "ac2-can-s06", duAn: d, phuong: A("a5"), m2: 60, pn: 2, perm2: 80 * M });
    await tin(c, { id: "ac2-can-s03", duAn: d, phuong: A("a5"), m2: 60, pn: 2, perm2: 81 * M });
    await can(c, ["ac2-can-s06", "ac2-can-s03"]);
  });
  // f) tin S03 không dự án (cấp phường), cùng phường a1
  await tin(c, { id: "ac2-phuong", phuong: A("a1"), m2: 60, pn: 2, perm2: 50 * M });
  await xepHangGia(c, im);
  const rows = await matBang(c);
  const cua = (d) => rows.filter((r) => r.nut === String(d));
  const mot = (d, ten) => { const x = cua(d); assert.equal(x.length, 1, `${ten}: ${x.length} dòng (${x.map(khoa).join(", ")})`); return x[0]; };
  kiemDong(mot(a.d, "CG15-AC-2 a"), { n3: 4, n6: 6, tv3: trungVi(a.v3), tv6: trungVi(a.v6), trangThai: "thieu-s03" }, "CG15-AC-2 a S03 4 + phi lý");
  kiemDong(mot(b.d, "CG15-AC-2 b"), { n3: 6, n6: 4, tv3: trungVi(b.v3), tv6: trungVi(b.v6), trangThai: "thieu-s06" }, "CG15-AC-2 b S06 4");
  kiemDong(mot(ch.d, "CG15-AC-2 c"), { n3: 3, n6: 3, tv3: trungVi(ch.v3), tv6: trungVi(ch.v6), trangThai: "thieu-hai" }, "CG15-AC-2 c cả hai dưới 5");
  kiemDong(mot(dd.d, "CG15-AC-2 d"), { n3: 0, n6: 6, tv3: null, tv6: trungVi(dd.v6), trangThai: "thieu-s03" }, "CG15-AC-2 d chỉ S06");
  const re = mot(e.d, "CG15-AC-2 e");
  kiemDong(re, { n3: 6, n6: 6, tv3: trungVi([...e.v3, 81 * M]), tv6: trungVi([...e.v6, 80 * M]), trangThai: "du" }, "CG15-AC-2 e S05 không vào, căn ghép S03");
  assert.notEqual(re.lech_pct, null, "CG15-AC-2 đối chứng dương: nhóm đủ hai bên mà không có lech_pct");
  // ô S02: không tin S02 nào ở cấp dự án (n của hai bên ở ô e đã không đếm S02)
  const hang2 = await dongs(c);
  assert.ok(["ac2-s02-0", "ac2-s02-1"].every((id) => hang2[id]?.cap !== "du_an"), "CG15-AC-2 ô S02: tin S02 lên cấp dự án");
  // ô S03 cấp phường: tin có hạng cấp phường, không sinh dòng mặt bằng nào mang nút phường của nó
  assert.equal(hang2["ac2-phuong"]?.cap, "phuong", "CG15-AC-2 ô cấp phường: tin không có hạng cấp phường");
  assert.ok(rows.every((r) => r.nut !== hang2["ac2-phuong"].nut), "CG15-AC-2 ô cấp phường: có dòng mặt bằng theo nút phường");
  assert.equal(rows.length, 5, `CG15-AC-2 số dòng mặt bằng ≠ năm dự án: ${rows.map(khoa).join(", ")}`);
});

// ---------- AC-3 ----------
async function fixtureAc3(c) {
  const d = await duAn(c);
  for (let i = 0; i < 5; i++) {
    await tin(c, { id: `ac3-ban3-${i}`, duAn: d, m2: 60, pn: 2, perm2: (50 + i) * M });
    await tinS06(c, { id: `ac3-ban6-${i}`, duAn: d, m2: 60, pn: 2, perm2: (55 + i) * M });
    await tin(c, { id: `ac3-thue3-${i}`, kind: "rent_lt", duAn: d, m2: 60, pn: 2, perm2: (200 + 5 * i) * 1000 });
    await tinS06(c, { id: `ac3-thue6-${i}`, kind: "rent_lt", duAn: d, m2: 60, pn: 2, perm2: (210 + 5 * i) * 1000 });
    await tin(c, { id: `ac3-thang3-${i}`, kind: "rent_lt", duAn: d, pn: 2, gia: (10 + i) * M });
    await tinS06(c, { id: `ac3-thang6-${i}`, kind: "rent_lt", duAn: d, pn: 2, gia: (11 + i) * M });
  }
  return d;
}
async function kiemAc3(c, d) {
  const rows = (await matBang(c)).filter((r) => r.nut === String(d));
  const tim = (kind, thuoc) => rows.filter((r) => r.kind === kind && r.thuoc === thuoc);
  assert.equal(rows.length, 3, `CG15-AC-3 cần ba dòng (bán m², thuê m², thuê tháng): ${rows.map(khoa).join(", ")}`);
  const thang = tim("rent_lt", "gia-thang-pn");
  assert.equal(thang.length, 1, "CG15-AC-3 thiếu dòng thuê giá tháng");
  // nhóm giá tháng gom như nhóm dth của 422: tin thuê thiếu m² (giá tháng) + tin thuê có m² cùng PN (giá tháng = m² × giá/m²)
  const thang3 = [0, 1, 2, 3, 4].flatMap((i) => [(10 + i) * M, 60 * (200 + 5 * i) * 1000]);
  const thang6 = [0, 1, 2, 3, 4].flatMap((i) => [(11 + i) * M, 60 * (210 + 5 * i) * 1000]);
  kiemDong(thang[0], { n3: 10, n6: 10, tv3: trungVi(thang3), tv6: trungVi(thang6), trangThai: "du" }, "CG15-AC-3 thuê giá tháng");
  assert.equal(tim("rent_lt", "gia-m2").length, 1, "CG15-AC-3 thiếu dòng thuê giá/m²");
  assert.equal(tim("sale", "gia-m2").length, 1, "CG15-AC-3 thiếu dòng bán");
  // khoá dòng mặt bằng khớp khoá nhóm của mọi tin S03 cấp dự án
  const k = new Set(rows.map(khoa));
  for (const r of Object.values(await dongs(c))) {
    if (r.cap !== "du_an" || !/(ban|thue|thang)3-/.test(r.offer_id)) continue;
    assert.ok(k.has(khoa(r)), `CG15-AC-3 tin ${r.offer_id} [${khoa(r)}] không có dòng mặt bằng cùng khoá`);
  }
}
test("CG15-AC-3 thuê m² và thuê giá tháng tách dòng, khoá khớp nhóm hạng; bán và thuê không trộn", async () => {
  const c = await dbCa();
  const d = await fixtureAc3(c);
  await xepHangGia(c, im);
  await kiemAc3(c, d);
  // đột biến: nhóm giá tháng chỉ lấy tin có thước giá tháng (bỏ tin thuê có m²) → n và trung vị lệch
  await xepHangGia(c, { ...im, sql423: dot(["AND h.thuoc = 'gia-m2' AND (h.ly_do IS NULL", "AND h.thuoc = 'khong-co' AND (h.ly_do IS NULL"]) });
  await assert.rejects(kiemAc3(c, d), /CG15-AC-3 thuê giá tháng \[/, "CG15-AC-3 đột biến bỏ tin thuê có m² khỏi nhóm giá tháng không đỏ");
  // đột biến: bỏ kind khỏi khoá (mọi tin coi như bán) → bán và thuê m² trộn
  const sai = dot(["SELECT h.nut, h.kind,", "SELECT h.nut, 'sale'::text AS kind,"]);
  await assert.rejects(async () => { await xepHangGia(c, { ...im, sql423: sai }); await kiemAc3(c, d); },
    /CG15-AC-3|project_source_baseline_nhom_uq/, "CG15-AC-3 đột biến bỏ kind khỏi khoá không đỏ");
});

// ---------- AC-4 ----------
const boDong = (r) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "computed_at" && k !== "run_id"));
test("CG15-AC-4 chạy lại giống hệt; lỗi giữa chừng giữ bảng cũ; chưa áp 107; không view; 107 áp hai lần", async () => {
  const c = await dbCa();
  await fixtureAc1(c);
  await xepHangGia(c, im);
  const l1 = (await matBang(c)).map(boDong);
  assert.ok(l1.length >= 1, "CG15-AC-4 đối chứng: lượt đầu không có dòng");
  await xepHangGia(c, im);
  assert.deepEqual((await matBang(c)).map(boDong), l1, "CG15-AC-4 chạy lại khác lần đầu");
  await assert.rejects(xepHangGia(c, { ...im, sauXoa: async () => { throw new Error("ném sau xoá"); } }), /ném sau xoá/);
  assert.deepEqual((await matBang(c)).map(boDong), l1, "CG15-AC-4 lỗi giữa chừng làm mất bảng mặt bằng cũ");
  assert.ok(Object.keys(await dongs(c)).length > 0, "CG15-AC-4 lỗi giữa chừng làm mất bảng hạng cũ");
  // chưa áp 107: thoát êm, đúng dòng báo, hạng bằng lượt có 107
  const c2 = await dbCa({ bo107: true });
  await fixtureAc1(c2);
  const dongIn = [];
  const kq = await xepHangGia(c2, { log: (s) => dongIn.push(s) });
  assert.ok(dongIn.includes("xep-hang-gia: chưa áp 107 — bỏ mặt bằng hai nguồn"), `CG15-AC-4 thiếu dòng báo: ${dongIn.join(" | ")}`);
  assert.equal(kq.matBang, null);
  const h1 = Object.values(await dongs(c)).map((r) => [r.offer_id, r.cap, r.nut, r.n, r.nhan]).sort();
  const h2 = Object.values(await dongs(c2)).map((r) => [r.offer_id, r.cap, r.nut, r.n, r.nhan]).sort();
  assert.deepEqual(h2.map((x) => x.slice(1)), h1.map((x) => x.slice(1)), "CG15-AC-4 chưa áp 107 mà hạng khác lượt có 107");
  await assert.rejects(xepHangGia(c2, { ...im, boDo107: true }), /project_source_baseline/, "CG15-AC-4 đột biến ghi không dò bảng không đỏ");
  // không view 105 → bảng rỗng
  const c3 = await dbCa({ view: false });
  await fixtureAc1(c3);
  await xepHangGia(c3, im);
  assert.equal((await matBang(c3)).length, 0, "CG15-AC-4 không view mà có dòng mặt bằng");
  // 107 áp hai lần
  const mig = readFileSync(join(GOC, "db/migrations/107_project_source_baseline.sql"), "utf8");
  await c3.query(mig);
  await c3.query(mig);
});

