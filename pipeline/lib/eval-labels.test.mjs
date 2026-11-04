// eval-labels.test.mjs — PL7 `man-gan-nhan-mu`: ma trận viết trước cho phần thuần (chọn mẫu, phút công, trường thấp nhất).
// Số kỳ vọng tính tay, không suy từ hàm đang kiểm.
import { test } from "node:test";
import assert from "node:assert/strict";

import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { chonMau, chonMauTheoNhom, donViCuaBai, donViTheoNhomThat, khoaNhomThat, phutCong, textHash, thapNhat } from "./eval-labels.mjs";

// 30 nội dung khác nhau + 5 bản trùng chữ (khác hoa thường/dấu câu) của 5 tin đầu.
const POSTS = [
  ...Array.from({ length: 30 }, (_, i) => ({ post_id: `p${String(i).padStart(2, "0")}`, text: `Bán căn hộ số ${i} toà S${i % 4}` })),
  ...Array.from({ length: 5 }, (_, i) => ({ post_id: `z${i}`, text: `  BÁN căn hộ số ${i} toà S${i % 4}!!` })),
];

test("textHash: cùng chữ khác hoa thường/dấu câu → cùng băm; khác chữ → khác băm", () => {
  assert.equal(textHash("Bán căn LD2"), textHash("  BÁN  căn, LD2 "));
  assert.notEqual(textHash("Bán căn LD2"), textHash("Bán căn LD3"));
});

test("chonMau n=20: đúng 20 dòng, không trùng nội dung, 4 tin gắn trùng, dev/test 10/10", () => {
  const { chon, khac_nhau } = chonMau(POSTS, { n: 20, seed: "mgn" });
  assert.equal(khac_nhau, 30, "5 bản trùng chữ phải gộp — KHU TRUNG HONG");
  assert.equal(chon.length, 20);
  assert.equal(new Set(chon.map((r) => r.text_hash)).size, 20, "hai dòng cùng nội dung");
  assert.equal(chon.filter((r) => r.double_label).length, 4);
  assert.equal(chon.filter((r) => r.split === "dev").length, 10);
  for (const r of chon) assert.ok(!r.ref_id.startsWith("z"), `bản trùng giữ post_id nhỏ nhất, gặp ${r.ref_id}`);
});

test("chonMau tất định: cùng seed → cùng tập; khác seed → tập khác", () => {
  const a = chonMau(POSTS, { n: 20, seed: "mgn" }).chon;
  const b = chonMau([...POSTS].reverse(), { n: 20, seed: "mgn" }).chon;
  assert.deepEqual(a, b);
  const c = chonMau(POSTS, { n: 20, seed: "khac" }).chon;
  assert.notDeepEqual(a.map((r) => r.ref_id).sort(), c.map((r) => r.ref_id).sort());
});

test("chonMau n lớn hơn số nội dung: lấy hết 30, 6 gắn trùng, dev 15", () => {
  const { chon } = chonMau(POSTS, { n: 100, seed: "mgn" });
  assert.equal(chon.length, 30);
  assert.equal(chon.filter((r) => r.double_label).length, 6);
  assert.equal(chon.filter((r) => r.split === "dev").length, 15);
});

test("chonMau số lẻ: n=7 → 1 gắn trùng (làm tròn 1,4), dev 4 / test 3", () => {
  const { chon } = chonMau(POSTS, { n: 7, seed: "mgn" });
  assert.equal(chon.filter((r) => r.double_label).length, 1);
  assert.equal(chon.filter((r) => r.split === "dev").length, 4);
});

test("phutCong: A lưu ở phút 0, 2, 5, 45, 48 → 8 phút (bỏ khoảng nghỉ 40); B một lượt → 0", () => {
  const t0 = Date.parse("2026-10-30T02:00:00Z");
  const at = (m) => new Date(t0 + m * 60_000).toISOString();
  const rows = [];
  for (const m of [0, 2, 5, 45, 48]) for (let f = 0; f < 9; f++) rows.push({ labeler_id: "A", labeled_at: at(m) });
  rows.push({ labeler_id: "B", labeled_at: at(3) });
  assert.deepEqual(phutCong(rows), { A: 8, B: 0 }, "PHUT CONG CONG KHOANG NGHI hoặc đếm trùng mốc");
});

test("thapNhat: bỏ trường chưa có cặp; mọi trường null → null", () => {
  assert.deepEqual(thapNhat([{ field: "kind", ti_le: 0.95 }, { field: "area_m2", ti_le: 0.8 }, { field: "project", ti_le: null }]),
    { field: "area_m2", ti_le: 0.8 });
  assert.equal(thapNhat([{ field: "kind", ti_le: null }]), null);
});

// Nhóm A 50 nội dung, B 40 trong đó 10 trùng với A, C 8, D 3, cộng 2 bài không có đơn vị.
const NHOM = [
  ...Array.from({ length: 50 }, (_, i) => ({ post_id: `a${i}`, text: `bai A ${i}`, unit_code: "A" })),
  ...Array.from({ length: 30 }, (_, i) => ({ post_id: `b${i}`, text: `bai B ${i}`, unit_code: "B" })),
  ...Array.from({ length: 10 }, (_, i) => ({ post_id: `bt${i}`, text: `bai A ${i}`, unit_code: "B" })),
  ...Array.from({ length: 8 }, (_, i) => ({ post_id: `c${i}`, text: `bai C ${i}`, unit_code: "C" })),
  ...Array.from({ length: 3 }, (_, i) => ({ post_id: `d${i}`, text: `bai D ${i}`, unit_code: "D" })),
  { post_id: "x0", text: "khong don vi 0", unit_code: null },
  { post_id: "x1", text: "khong don vi 1", unit_code: null },
];
const OPT = { seed: "s", moiNhomLon: 30, moiNhomNho: 5, soNhomLon: 2 };

test("chon theo nhom: đủ số, nhóm nhỏ tới 5, gắn trùng 20% trong nhóm, nội dung không trùng, đếm bài bỏ", () => {
  const r = chonMauTheoNhom(NHOM, OPT);
  const dem = (u, f = () => true) => r.chon.filter((x) => x.stratum === u && f(x)).length;
  assert.deepEqual(["A", "B", "C", "D"].map((u) => dem(u)), [30, 30, 5, 3]);
  assert.deepEqual(["A", "B", "C", "D"].map((u) => dem(u, (x) => x.double_label)), [6, 6, 1, 1]);
  assert.equal(new Set(r.chon.map((x) => x.text_hash)).size, r.chon.length);
  assert.equal(r.bo_khong_don_vi, 2);
  assert.deepEqual(r.moiNhom.map((x) => x.unit_code), ["A", "B", "C", "D"]);
});

test("chon theo nhom: nội dung trùng thuộc nhóm xếp trước, nhóm sau bù đủ, số bị bỏ đúng", () => {
  const r = chonMauTheoNhom(NHOM, OPT);
  const a = new Set(r.chon.filter((x) => x.stratum === "A").map((x) => x.text_hash));
  const b = r.chon.filter((x) => x.stratum === "B");
  assert.equal(b.length, 30);
  assert.ok(b.every((x) => !a.has(x.text_hash)));
  const mB = r.moiNhom.find((x) => x.unit_code === "B");
  assert.equal(mB.bo_vi_trung, [...new Set(NHOM.filter((p) => p.unit_code === "B").map((p) => textHash(p.text)))].filter((h) => a.has(h)).length);
  assert.ok(mB.bo_vi_trung > 0, "fixture phải có nội dung trùng thật");
});

test("chon theo nhom: tất định; đổi nhóm xếp sau không đổi mẫu nhóm xếp trước", () => {
  const r1 = chonMauTheoNhom(NHOM, OPT);
  assert.deepEqual(chonMauTheoNhom([...NHOM].reverse(), OPT).chon.map((x) => x.ref_id).sort(), r1.chon.map((x) => x.ref_id).sort());
  const r2 = chonMauTheoNhom(NHOM.filter((p) => p.unit_code !== "D").concat({ post_id: "d9", text: "bai D khac", unit_code: "D" }), OPT);
  const lay = (r) => r.chon.filter((x) => x.stratum === "A").map((x) => x.ref_id).sort();
  assert.deepEqual(lay(r2), lay(r1));
});

// Bảng dạng khoá của AC-4 (nhom-dang-ky-hai-lan-s03), viết tay trước khi có mã. `bai`: khoá của bài → đơn vị kỳ vọng.
const BANG_NHOM_THAT = [
  { o: 1, so: [["x", "A"]], bai: { x: "A" }, gop: [] },
  { o: 2, so: [["group:x", "A"]], bai: { x: "A", "group:x": "A" }, gop: [] },
  { o: 3, so: [["k:group:x", "A"]], bai: { x: "A", "k:group:x": "A" }, gop: [] },
  { o: 4, so: [["x", "A"], ["k:group:x", "B"]], bai: { x: "A", "k:group:x": "A" }, gop: [["A", ["B"]]] },
  { o: 5, so: [["k:group:x", "A"], ["x", "B"]], bai: { x: "B", "k:group:x": "B" }, gop: [["B", ["A"]]] },
  { o: 6, so: [["x", "A"], ["group:x", "B"], ["k:group:x", "C"]], bai: { x: "A", "group:x": "A", "k:group:x": "A" }, gop: [["A", ["B", "C"]]] },
  { o: 7, so: [["k1:group:x", "A"], ["k2:group:x", "B"]], bai: { "k1:group:x": "A", "k2:group:x": "A" }, gop: [["A", ["B"]]] },
  { o: 8, so: [["x", "A", "paused"], ["k:group:x", "B", "active"]], bai: { x: "A", "k:group:x": "A" }, gop: [["A", ["B"]]] },
  { o: 9, so: [["conv-x", "A"]], bai: { "conv-x": "A" }, gop: [] },
  { o: 10, so: [["a:b:group:x", "A"], ["x", "B"]], bai: { "a:b:group:x": "A", x: "B" }, gop: [] },
  { o: 11, so: [["conv:x", "A"], ["x", "B"]], bai: { "conv:x": "A", x: "B" }, gop: [] },
  { o: 12, so: [["k:group:", "A"]], bai: { "k:group:": "A" }, gop: [] },
  { o: 13, so: [["x", "A"]], bai: { "khoa-la": null }, gop: [] },
];

function kiemBangNhomThat(mod) {
  let dem = 0;
  for (const { o, so, bai, gop } of BANG_NHOM_THAT) {
    const r = mod.donViTheoNhomThat(so.map(([group_key, unit_code, status]) => ({ group_key, unit_code, status })));
    const thuc = Object.fromEntries(Object.keys(bai).map((k) => [k, mod.donViCuaBai(r.donVi, k)]));
    const cungBai = JSON.stringify(thuc) === JSON.stringify(bai);
    const cungGop = JSON.stringify(r.gop.map((g) => [g.unit_code, g.gop_tu])) === JSON.stringify(gop);
    if (!cungBai || !cungGop) throw new Error(`NHOM THAT SAI: ô ${o} bài ${JSON.stringify(thuc)} gộp ${JSON.stringify(r.gop.map((g) => [g.unit_code, g.gop_tu]))}`);
    dem++;
  }
  return dem;
}

async function banDotEvalLabels(a, b) {
  const goc = fileURLToPath(new URL("./eval-labels.mjs", import.meta.url));
  const src = readFileSync(goc, "utf8");
  assert.ok(src.includes(a), `chỗ đột biến không còn: ${a}`);
  const dir = mkdtempSync(path.join(path.dirname(goc), ".ndk-dot-"));
  try {
    writeFileSync(path.join(dir, "eval-labels.mjs"), src.replace(a, b).replace(/from "\.\/([^"]+)"/g, (_m, rel) => `from ${JSON.stringify(pathToFileURL(path.join(path.dirname(goc), rel)).href)}`));
    return await import(pathToFileURL(path.join(dir, "eval-labels.mjs")).href);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("nhom that: đúng 13 ô của bảng dạng khoá", () => {
  assert.equal(kiemBangNhomThat({ donViTheoNhomThat, donViCuaBai }), 13);
});

test("nhom that: bài không có khoá không ném, trả null, được đếm là bỏ", () => {
  const { donVi } = donViTheoNhomThat([{ group_key: "x", unit_code: "A" }]);
  assert.equal(donViCuaBai(donVi, null), null);
  const r = chonMauTheoNhom([{ post_id: "p", text: "bài", unit_code: donViCuaBai(donVi, null) }], { seed: "s", moiNhomLon: 30, moiNhomNho: 5, soNhomLon: 2 });
  assert.equal(r.bo_khong_don_vi, 1);
});

test("nhom that: hai dòng khác thẻ thì the_lech; cùng thẻ hay không có thẻ thì không", () => {
  const lech = (a, b) => donViTheoNhomThat([{ group_key: "x", unit_code: "A", note: a }, { group_key: "k:group:x", unit_code: "B", note: b }]).gop[0].the_lech;
  assert.equal(lech("t1", "t2"), true);
  assert.equal(lech("t1", "t1"), false);
  assert.equal(lech(null, null), false);
});

test("nhom that: sổ và bài toàn khoá trần hoặc khoá lạ → mẫu y hệt so nguyên văn", () => {
  const so = [["ka", "A"], ["kb", "B"], ["conv-c", "C"]].map(([group_key, unit_code]) => ({ group_key, unit_code }));
  const bai = Array.from({ length: 60 }, (_, i) => ({ post_id: `n${i}`, text: `bài số ${i}`, conversation_id: ["ka", "kb", "conv-c"][i % 3] }));
  const nguyenVan = new Map(so.map((r) => [r.group_key, r.unit_code]));
  const { donVi } = donViTheoNhomThat(so);
  const opt = { seed: "s", moiNhomLon: 12, moiNhomNho: 5, soNhomLon: 1 };
  assert.deepEqual(
    chonMauTheoNhom(bai.map((p) => ({ ...p, unit_code: donViCuaBai(donVi, p.conversation_id) })), opt),
    chonMauTheoNhom(bai.map((p) => ({ ...p, unit_code: nguyenVan.get(p.conversation_id) ?? null })), opt));
});

test("nhom that chiều đỏ: bản khoá nguyên văn và bản gộp quá tay làm bảng ném thông điệp ghim", async () => {
  assert.equal(khoaNhomThat("k:group:x"), "x");
  const moc = 'String(khoa).replace(/^(?:[^:]+:)?group:(?=.)/, "")';
  const nguyenVan = await banDotEvalLabels(moc, "String(khoa)");
  assert.throws(() => kiemBangNhomThat(nguyenVan), /NHOM THAT SAI: ô 2 /);
  const quaTay = await banDotEvalLabels(moc, 'String(khoa).replace(/^.*:/, "")');
  assert.throws(() => kiemBangNhomThat(quaTay), /NHOM THAT SAI: ô 10 /);
});
