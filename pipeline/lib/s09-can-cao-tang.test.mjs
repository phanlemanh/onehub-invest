// DA43 nap-s09-can-cao-tang-vao-danh-ba — AC-3, E3: ma trận viết trước, khuôn lấy từ gói 2 thật (đếm 26/11, thiết kế §0.3).
// Mỗi ô một assert giá trị trả về; chiều đỏ chạy hai đột biến trên bản sao tệp hàm.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { tachMaCanS09, khoaCan } from "./s09-can-cao-tang.mjs";

const TEP = fileURLToPath(new URL("./s09-can-cao-tang.mjs", import.meta.url));

/** [tên ô, code, tầng của item, kỳ vọng]. Toà không có trong đầu vào: hàm không đọc toà từ mã (toà là của item). */
export const MA_TRAN = [
  ["mã chuẩn", "A14A1.02.01", "02", { ok: true, tang: "2", so: "1", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["toà có dấu chấm", "A1.1.05.03", "05", { ok: true, tang: "5", so: "3", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["toà viết tắt", "AQL1.04.11", "04", { ok: true, tang: "4", so: "11", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["hai đoạn có gạch", "AK1-015.21", "15", { ok: true, tang: "15", so: "21", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["hai đoạn trần", "04.01", "04", { ok: true, tang: "4", so: "1", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["dấu tách gạch dưới", "T1-2_2", "2", { ok: true, tang: "2", so: "2", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["tầng có chữ", "A14A1.12A.03", "12A", { ok: true, tang: "12A", so: "3", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["số căn có số 0 đầu", "05.007", "5", { ok: true, tang: "5", so: "7", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["mã ghi tầng khác tầng item", "A14A1.12A.01", "02", { ok: true, tang: "12A", so: "1", tangTuMa: true, lechItem: true, ngoaiKhuon: false }],
  ["mã không có đoạn tầng", "T1.05", "7", { ok: true, tang: "7", so: "5", tangTuMa: false, lechItem: false, ngoaiKhuon: false }],
  ["số căn có chữ", "A-09.B5", "09", { ok: true, tang: "9", so: "B5", tangTuMa: true, lechItem: false, ngoaiKhuon: false }],
  ["mã không có dấu tách", "A905", "9", { ok: false, lyDo: "khong-dau-tach" }],
  ["số căn rỗng", "A.05.", "5", { ok: false, lyDo: "so-rong" }],
  ["tầng ngoài khuôn", "1+2.05", "1+2", { ok: true, tang: "1+2", so: "5", tangTuMa: false, lechItem: false, ngoaiKhuon: true }],
];

for (const [ten, code, tangItem, mong] of MA_TRAN) {
  test(`AC-3 ô «${ten}»: ${code} (tầng item ${tangItem})`, () => {
    assert.deepEqual(tachMaCanS09(code, { tangItem }), mong, `ô «${ten}»`);
  });
}

test("AC-3 «code» khác «name»: hàm chỉ đọc code (name không vào tham số)", () => {
  assert.equal(tachMaCanS09.length, 2);
  assert.deepEqual(tachMaCanS09("A.05.02", { tangItem: "5", name: "khác hẳn" }), tachMaCanS09("A.05.02", { tangItem: "5" }));
});

test("khoaCan ghép toà, tầng, số căn", () => {
  assert.equal(khoaCan("bld_1", "12A", "3"), "bld_1|12A|3");
});

/** Chạy lại ma trận trên bản sao tệp hàm đã đột biến; trả tên các ô đỏ. */
async function oDoSauDotBien(tim, thay) {
  const goc = readFileSync(TEP, "utf8");
  assert.ok(goc.includes(tim), `đột biến không tìm thấy chuỗi: ${tim}`);
  const dir = mkdtempSync(join(tmpdir(), "s09-can-dot-bien-"));
  try {
    const tep = join(dir, "s09-can-cao-tang.mjs");
    writeFileSync(tep, goc.replace(tim, thay));
    const { tachMaCanS09: f } = await import(pathToFileURL(tep).href);
    return MA_TRAN.filter(([, code, tangItem, mong]) => {
      try { assert.deepEqual(f(code, { tangItem }), mong); return false; } catch { return true; }
    }).map(([ten]) => ten);
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

test("chiều đỏ: tách ở dấu tách ĐẦU thay vì cuối → ô «toà có dấu chấm» đỏ", async () => {
  const do_ = await oDoSauDotBien("/* DOT-BIEN:dau-tach */ Math.max(s.lastIndexOf(\".\"), s.lastIndexOf(\"_\"))",
    "/* DOT-BIEN:dau-tach */ s.search(/[._]/)");
  assert.ok(do_.includes("toà có dấu chấm"), `ô đỏ: ${do_.join(", ")}`);
});

test("chiều đỏ: bỏ đọc tầng trong mã, luôn lấy tầng của item → ô «mã ghi tầng khác tầng item» đỏ", async () => {
  const do_ = await oDoSauDotBien("/* DOT-BIEN:tang-tu-ma */ TANG.test(doan)", "/* DOT-BIEN:tang-tu-ma */ false");
  assert.ok(do_.includes("mã ghi tầng khác tầng item"), `ô đỏ: ${do_.join(", ")}`);
});
