// link-nguoi-ban-s03 AC-9 — test tiền kiểm riêng của bộ tra hồ sơ.
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { tienKiemHoSo } from "./tien-kiem-ho-so.mjs";

const PATCH_DUNG = ["+++ b/seller-lookup.ts", "+    const resp = await api.getUserInfo(mas)"].join("\n");

function taoDir() {
  return mkdtempSync(join(tmpdir(), "lnb-tk-"));
}

test("thư mục trống + .patch đúng → 0 lỗi", () => {
  const d = taoDir();
  const p = join(d, "ext.patch");
  writeFileSync(p, PATCH_DUNG);
  assert.deepEqual(tienKiemHoSo(d, p), []);
  rmSync(d, { recursive: true, force: true });
});

test("còn tệp yêu cầu / lượt lớn / chặn → từng lỗi nêu tên tệp", () => {
  const d = taoDir();
  const p = join(d, "ext.patch");
  writeFileSync(p, PATCH_DUNG);
  writeFileSync(join(d, "yeu-cau.json"), "{}");
  writeFileSync(join(d, "luot-lon.txt"), "bat");
  const loi = tienKiemHoSo(d, p);
  assert.equal(loi.length, 2);
  assert.match(loi[0], /yeu-cau\.json/);
  assert.match(loi[1], /luot-lon\.txt/);
  rmSync(d, { recursive: true, force: true });
});

test(".patch thêm 2 điểm gọi api.getUserInfo → lỗi «phải đúng 1»", () => {
  const d = taoDir();
  const p = join(d, "ext.patch");
  writeFileSync(p, "+a.api.getUserInfo(x)\n+b.api.getUserInfo(y)");
  const loi = tienKiemHoSo(d, p);
  assert.ok(loi.some((l) => /đúng 1/.test(l)));
  rmSync(d, { recursive: true, force: true });
});

test("khai báo kiểu + API giả test (không phải api.getUserInfo) không tính là điểm gọi", () => {
  const d = taoDir();
  const p = join(d, "ext.patch");
  writeFileSync(
    p,
    ["+  getUserInfo(userId: string | string[]): Promise<X>;", "+    getUserInfo: async (uids) => {}", "+    const resp = await api.getUserInfo(mas)"].join("\n"),
  );
  assert.deepEqual(tienKiemHoSo(d, p), []);
  rmSync(d, { recursive: true, force: true });
});

test(".patch thêm login( → lỗi lời gọi cấm", () => {
  const d = taoDir();
  const p = join(d, "ext.patch");
  writeFileSync(p, "+a.api.getUserInfo(x)\n+await client.login(u)");
  const loi = tienKiemHoSo(d, p);
  assert.ok(loi.some((l) => /cấm/.test(l)));
  rmSync(d, { recursive: true, force: true });
});

test("thiếu .patch → lỗi", () => {
  const d = taoDir();
  assert.ok(tienKiemHoSo(d, join(d, "khong-co.patch")).some((l) => /thiếu/.test(l)));
  rmSync(d, { recursive: true, force: true });
});
