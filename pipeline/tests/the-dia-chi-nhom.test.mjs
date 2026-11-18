// the-dia-chi-nhom.test.mjs — hồ sơ the-dia-chi-nhom-s03 (TG1) E2 · AC-2: ma trận viết trước 16 ô cho hàm dựng nháp.
// Không DB. Đối chứng đỏ: bản sao hàm (tệp tạm) bỏ luật 10% hay bỏ trần 3 nút thì đúng ô nhắm phải đổi kết cục.
import { strict as assert } from "node:assert";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";

import { dungNhap } from "../lib/the-dia-chi-nhom.mjs";

const NGUON_HAM = readFileSync(join(import.meta.dirname, "..", "lib", "the-dia-chi-nhom.mjs"), "utf8");

// Danh bạ giả: năm dự án (A–E), hai phân khu của A, phường P1, P2 thuộc tỉnh T1.
const duAn = [
  { id: 1, name: "Dự án A", aliases: ["DA A"], area_ids: ["P1"] },
  { id: 2, name: "Dự án B", area_ids: ["P1"] },
  { id: 3, name: "Dự án C", area_ids: ["P2"] },
  { id: 4, name: "Dự án D", area_ids: [] },
  { id: 5, name: "Dự án E", area_ids: [] },
];
const phanKhu = [{ id: 11, name: "Phân khu X", parent_id: 1 }, { id: 12, name: "Phân khu Y", parent_id: 1 }];
const nen = { duAn, phanKhu, tinhCua: { P1: "T1", P2: "T1" }, laPhuong: ["P1", "P2"] };
const lap = (n, o) => Array.from({ length: n }, () => ({ ...o }));
const ten = (t, n) => lap(n, { project: t, projectCc: "chu_bai" });

const goc = (r) => ({ du_an: r.du_an, phuong: r.phuong, tinh: r.tinh, phan_khu: r.phan_khu, muc_dich: r.muc_dich });

/** [tên ô, đầu vào, kết cục mong đợi (một phần), kiểm thêm] — viết trước, 16 phần tử. */
const MA_TRAN = [
  ["sổ một dự án", { soDuAn: [3] }, { du_an: [3], phuong: "P2", tinh: "T1" }, (r) => assert.equal(r.evidence.du_an.nguon, "so")],
  ["nhãn một tên 40 bài", { nhan: ten("Dự án A", 40) }, { du_an: [1], phuong: "P1" }, (r) => assert.deepEqual([r.evidence.du_an.nguon, r.evidence.du_an.so_bai], ["nhan", 40])],
  ["hai tên 30 và 12 trên 50", { nhan: [...ten("Dự án C", 30), ...ten("dự án b", 12), ...ten("Không khớp", 8)] }, { du_an: [3, 2], phuong: null }, null],
  ["bốn tên đều đủ ngưỡng", { nhan: [...ten("Dự án A", 20), ...ten("Dự án B", 15), ...ten("Dự án C", 10), ...ten("Dự án D", 8)] }, { du_an: [1, 2, 3] }, null],
  ["tên 2 bài", { nhan: ten("Dự án A", 2) }, { du_an: [] }, (r) => assert.equal(r.evidence.du_an.bai_neu_ten, 2)],
  ["tên 4/50 bài", { nhan: [...ten("Dự án D", 4), ...ten("Dự án E", 46)] }, { du_an: [5] }, null],
  ["tên không khớp nút", { nhan: ten("Khu Lạ", 20) }, { du_an: [], phuong: null }, null],
  ["một dự án có phường", { nhan: ten("DA A", 10) }, { du_an: [1], phuong: "P1", tinh: "T1" }, (r) => assert.equal(r.evidence.phuong.nguon, "du_an")],
  ["hai dự án cùng phường", { nhan: [...ten("Dự án A", 10), ...ten("Dự án B", 10)] }, { du_an: [1, 2], phuong: "P1" }, null],
  ["tin 7/10 cùng phường", { tinPhuong: [...Array(7).fill("P2"), ...Array(3).fill("P1")] }, { du_an: [], phuong: "P2", tinh: "T1" }, (r) => assert.deepEqual([r.evidence.phuong.nguon, r.evidence.phuong.so_bai], ["tin", 7])],
  ["tin 5/10", { tinPhuong: [...Array(5).fill("P2"), ...Array(5).fill("P1")] }, { phuong: null, tinh: null }, null],
  ["phân khu 6/10 bài", { nhan: [...ten("Dự án A", 10).map((n, i) => ({ ...n, subzone: i < 6 ? "Phân khu X" : i < 8 ? "Phân khu Y" : "Lạ", subzoneCc: "chu_bai" }))] }, { du_an: [1], phan_khu: 11 }, null],
  ["phân khu 2 bài", { nhan: [...ten("Dự án A", 10).map((n, i) => ({ ...n, subzone: i < 2 ? "Phân khu X" : undefined, subzoneCc: "chu_bai" }))] }, { phan_khu: null }, null],
  ["bán 18/20", { nhan: [...lap(18, { kind: "sale" }), ...lap(2, { kind: "rent_lt" })] }, { muc_dich: "ban" }, (r) => assert.equal(r.evidence.muc_dich.so_bai, 18)],
  ["thuê 17/20 và cả hai 10/10", { nhan: [...lap(17, { kind: "rent_lt" }), ...lap(3, { kind: "sale" })] }, { muc_dich: "thue" }, () => {
    assert.equal(dungNhap({ ...nen, nhan: [...lap(10, { kind: "sale" }), ...lap(10, { kind: "rent_lt" })] }).muc_dich, "ca_hai", "cả hai 10/10");
  }],
  ["dưới 5 bài đọc", { nhan: lap(4, { kind: "sale" }) }, { muc_dich: null }, (r) => assert.equal(r.evidence.so_bai_doc, 4)],
];

test("TG1-AC-2 ma trận 16 ô dựng nháp", () => {
  assert.equal(MA_TRAN.length, 16, "TG1-AC-2: ma trận phải đủ 16 ô viết trước");
  for (const [ten_o, vao, mong, them] of MA_TRAN) {
    const r = dungNhap({ ...nen, ...vao });
    const g = goc(r);
    for (const [k, v] of Object.entries(mong)) assert.deepEqual(g[k], v, `TG1-AC-2 «${ten_o}»: ô ${k}`);
    // Mỗi ô có giá trị phải mang nguồn căn cứ; ô trống mang số bài đã đọc.
    if (r.du_an.length) assert.ok(r.evidence.du_an.nguon, `«${ten_o}»: ô dự án thiếu nguồn`);
    if (r.phuong) assert.ok(r.evidence.phuong.nguon, `«${ten_o}»: ô phường thiếu nguồn`);
    if (r.phan_khu) assert.ok(r.evidence.phan_khu.so_bai > 0, `«${ten_o}»: ô phân khu thiếu số bài`);
    if (r.muc_dich) assert.ok(r.evidence.muc_dich.so_bai > 0, `«${ten_o}»: ô bán/thuê thiếu số bài`);
    assert.equal(typeof r.evidence.so_bai_doc, "number", `«${ten_o}»: thiếu số bài đã đọc`);
    if (them) them(r);
  }
});

test("TG1-AC-2 nhãn đoán từ ngữ cảnh nhóm không tính", () => {
  const r = dungNhap({ ...nen, nhan: lap(20, { project: "Dự án A", projectCc: "ngu_canh_nhom" }) });
  assert.deepEqual(r.du_an, [], "nhãn ngu_canh_nhom không được dựng ô dự án");
});

/** Nạp bản sao hàm đã phá một chỗ. */
async function banPha(cu, moi) {
  assert.ok(NGUON_HAM.includes(cu), `không tìm thấy đoạn để phá: ${cu}`);
  const d = mkdtempSync(join(tmpdir(), "tg1-pha-"));
  const f = join(d, "ham.mjs");
  writeFileSync(f, NGUON_HAM.replace(cu, moi));
  try { return (await import(pathToFileURL(f).href)).dungNhap; } finally { rmSync(d, { recursive: true, force: true }); }
}

test("TG1-AC-2 đối chứng đỏ: bỏ luật 10% thì ô «tên 4/50» ra nút", async () => {
  const pha = await banPha("c >= NGUONG.duAnTiLe * neuTen", "true");
  const vao = MA_TRAN.find((x) => x[0] === "tên 4/50 bài")[1];
  assert.deepEqual(dungNhap({ ...nen, ...vao }).du_an, [5], "bản lành");
  assert.notDeepEqual(pha({ ...nen, ...vao }).du_an, [5], "nguong-10: bản bỏ 10% vẫn chỉ ra [5] — ca không phân biệt được");
});

test("TG1-AC-2 đối chứng đỏ: bỏ trần 3 nút thì ô «bốn tên» ra bốn nút", async () => {
  const pha = await banPha(".slice(0, NGUONG.duAnToiDa)", "");
  const vao = MA_TRAN.find((x) => x[0] === "bốn tên đều đủ ngưỡng")[1];
  assert.equal(pha({ ...nen, ...vao }).du_an.length, 4, "tran-3: bản bỏ trần không ra bốn nút — ca không phân biệt được");
});
