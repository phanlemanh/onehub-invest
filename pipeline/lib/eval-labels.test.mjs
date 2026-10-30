// eval-labels.test.mjs — PL7 `man-gan-nhan-mu`: ma trận viết trước cho phần thuần (chọn mẫu, phút công, trường thấp nhất).
// Số kỳ vọng tính tay, không suy từ hàm đang kiểm.
import { test } from "node:test";
import assert from "node:assert/strict";

import { chonMau, phutCong, textHash, thapNhat } from "./eval-labels.mjs";

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
