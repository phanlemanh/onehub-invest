// U1(8) — chon-ma-ho-so đọc SPOOL: mã đã tra nhưng CHƯA GỬI được tới collector
// (spool-ho-so.jsonl của bộ tra) không được chọn lại. Thuần, không DB.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chonMa, maTrongSpool } from "./chon-ma-ho-so.mjs";

function dirSpool(dong) {
  const d = mkdtempSync(join(tmpdir(), "lnb-spool-"));
  writeFileSync(join(d, "spool-ho-so.jsonl"), dong.join("\n") + "\n");
  return d;
}

test("maTrongSpool: đọc đúng mã từ spool-ho-so.jsonl; dòng dở/sai khuôn bỏ qua; thiếu tệp → rỗng", () => {
  const d = dirSpool([
    JSON.stringify({ ma_tai_khoan: "111", username: "u1", loai: "co-username", lay_luc: "2026-11-08T01:00:00Z" }),
    JSON.stringify({ ma_tai_khoan: "222", username: "", loai: "khong-username", lay_luc: "2026-11-08T01:00:01Z" }),
    "{\"ma_tai_khoan\": \"333\", \"username\": \"dở-đang-g", // dòng dở giữa chừng
    JSON.stringify({ ma_tai_khoan: "abc", loai: "co-username" }), // mã sai khuôn
  ]);
  const m = maTrongSpool(d);
  assert.equal(m.size, 2, "chỉ 2 mã hợp lệ");
  assert.ok(m.has("111") && m.has("222"));
  assert.ok(!m.has("333") && !m.has("abc"));
  rmSync(d, { recursive: true, force: true });
  const rong = mkdtempSync(join(tmpdir(), "lnb-spool-"));
  assert.equal(maTrongSpool(rong).size, 0, "thiếu tệp spool → rỗng");
  rmSync(rong, { recursive: true, force: true });
});

test("chonMa: mã có trong spool bị coi là ĐÃ TRA → không chọn lại", () => {
  const d = dirSpool([
    JSON.stringify({ ma_tai_khoan: "999", username: "u9", loai: "co-username", lay_luc: "2026-11-08T01:00:00Z" }),
  ]);
  const daTra = maTrongSpool(d);
  const taiKhoan = [
    { ma: "999", n_tin: 9, co_so: false }, // đã tra, kẹt spool — KHÔNG chọn lại
    { ma: "555", n_tin: 5, co_so: false }, // chưa tra — chọn
  ];
  const kq = chonMa(taiKhoan, new Map([["999", "p9"], ["555", "p5"]]), new Set(), daTra, []);
  assert.deepEqual(kq.mas, ["555"], "mã kẹt spool bị loại như đã tra");
  assert.equal(kq.dem.da_tra, 1);
  rmSync(d, { recursive: true, force: true });
});
