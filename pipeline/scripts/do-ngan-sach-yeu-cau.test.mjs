// do-ngan-sach-yeu-cau.test.mjs — yc1-khoang-le-va-doi-chung-do AC-3, AC-4: bốn lý do đỏ của lệnh đo ngân sách Yêu cầu đều
// từng được cho đỏ. Không DB. Bài là chữ thật, bộ đọc A là docNganSach + docDichVu thật; bộ đọc B là A với đúng một đột biến.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { BAI_MAU, DOT_BIEN, lyDoDo, soSanh, tuKiem } from "./do-ngan-sach-yeu-cau.mjs";
import { docDichVu, docNganSach } from "../lib/yeu-cau.mjs";
import { KIND } from "../lib/vocab.generated.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEP = path.join(HERE, "do-ngan-sach-yeu-cau.mjs");

test("YCNS-DO-AC-3 bài mẫu dựng từ đầu ra thật của bộ đọc", () => {
  const thue = BAI_MAU.find((b) => b.id === "thue");
  assert.equal(docDichVu(thue.text), KIND.rent_lt, "bài thuê phải được docDichVu đọc là thuê");
  assert.deepEqual(docNganSach(thue.text, docDichVu(thue.text)), { min: 8.5e6, max: 9e6 });
  const mua = BAI_MAU.find((b) => b.id === "mua");
  assert.deepEqual(docNganSach(mua.text, docDichVu(mua.text)), { min: 2.5e9, max: 3e9 });
});

test("YCNS-DO-AC-3 đối chứng dương: hai bộ đọc như nhau thì không lý do nào", () => {
  assert.deepEqual(lyDoDo(soSanh(BAI_MAU, docNganSach, docNganSach)), []);
});

for (const [ten, docB, mong] of DOT_BIEN) {
  test(`YCNS-DO-AC-3 đột biến ${ten} bật đúng ${mong.join(" + ")}`, () => {
    assert.deepEqual(lyDoDo(soSanh(BAI_MAU, docNganSach, docB)), mong);
  });
}

test("YCNS-DO-AC-4 tự kiểm đỏ khi bỏ một nhánh", () => {
  // Bản gốc: --tu-kiem thoát 0.
  const ok = execFileSync(process.execPath, [TEP, "--tu-kiem"], { encoding: "utf8" });
  assert.match(ok, /YCNS-DO TU-KIEM PASS 4\/4/);
  assert.ok(tuKiem().every((k) => k.ok));
  // Bản chép bỏ nhánh MIN LON HON MAX của lyDoDo, đặt cạnh tệp thật (giữ import tương đối), chạy --tu-kiem phải thoát 1.
  const nguon = readFileSync(TEP, "utf8");
  const nhanh = '  if (d.nguoc > 0) ly.push("MIN LON HON MAX");\n';
  assert.equal(nguon.split(nhanh).length, 2, "đột biến phải khớp đúng một chỗ");
  const tep = path.join(HERE, `.do-ngan-sach-dot-bien-${process.pid}.mjs`);
  writeFileSync(tep, nguon.replace(nhanh, ""));
  try {
    let code = 0, out = "";
    try { out = execFileSync(process.execPath, [tep, "--tu-kiem"], { encoding: "utf8" }); }
    catch (e) { code = e.status; out = String(e.stdout); }
    assert.equal(code, 1, `bản bỏ nhánh phải thoát 1:\n${out}`);
    assert.match(out, /YCNS-DO TU-KIEM FAIL min-lon-hon-max/);
  } finally {
    rmSync(tep, { force: true });
  }
});
