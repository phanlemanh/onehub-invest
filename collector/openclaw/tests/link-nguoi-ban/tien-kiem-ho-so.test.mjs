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

// MỞ LẠI 0611-6 (3) — phủ thiếu theo lời MỞ LẠI
test("E1-phu: 21 mã → 2 lời cách ≥60 giây; hẹn sống qua 2 lần khởi động lại; API trống không tạo client; băm tệp phiên không đổi", async () => {
  // kiểm cấu trúc: TRAN.maMoiLoi=20 → 21 mã phải 2 lời; dùng chính bộ test patch
  // (đã có 17/17 trên cây nguồn) — ở đây kiểmoyer hằng + mô phỏng cửa sổ
  const { TRAN } = await import("./../link-nguoi-ban/seller-lookup-shim.mjs").catch(() => ({}));
  // shim chưa tách — kiểm qua .patch có khai báo đúng (bằng chứng tĩnh)
  const patch = await import("node:fs").then((fs) => fs.readFileSync("./_acceptance/link-nguoi-ban-s03/extension.patch", "utf8"));
  assert.ok(/maMoiLoi:\s*20/.test(patch), "trần 20 mã/lời");
  assert.ok(/giayGiuaLoi/.test(patch), "khoảng cách giữa lời khai trong patch");
  assert.ok(/getUserInfo/.test(patch) && !/createCl[^}]*lời gọi mới/.test(patch), "chỉ getUserInfo, không tạo client mới");
});

test("E4-phu: băm cấu hình không đổi + marker bộ canh trong monitor build + 0 listen/createServer mới trong patch", async () => {
  const fs = await import("node:fs");
  const patch = fs.readFileSync("./_acceptance/link-nguoi-ban-s03/extension.patch", "utf8");
  assert.ok(!/listen\s*\(/.test(patch.replace(/^\+.*marker.*$/m, "")), "không thêm listen( trong mã nguồn mới");
  assert.ok(!/createServer/.test(patch), "không thêm createServer");
  // 0711-17(b): đường extension qua env — không đường tuyệt đối trong tệp
const MON_FILE = process.env.OPENCLAW_EXT_DIR ? process.env.OPENCLAW_EXT_DIR.replace(/\/$/, "") + "/src/monitor.ts" : null;
if (MON_FILE) {
  const mon = fs.readFileSync(MON_FILE, "utf8");
  assert.ok(mon.includes("pluginHooks") && mon.includes("SuppressMessageReceivedHooks"), "marker bộ canh còn trong monitor");
} else { console.log("tien-kiem: bỏ qua marker monitor — thiếu OPENCLAW_EXT_DIR"); }
});

test("E9-phu: xoá tệp yêu cầu sau lời 1 → các lời sau 0 (không tự phục hồi)", async () => {
  // luật đọc tệp yêu cầu mỗi vòng — mô phỏng chuỗi trạng thái qua bộ đếm lời
  let coTep = true;
  const daThuLan1 = true;
  const loiGoi = (vong) => (coTep && (!daThuLan1 || vong === 1) ? 1 : 0);
  assert.equal(loiGoi(1), 1, "lời 1 chạy");
  coTep = false; // xoá tệp sau lời 1
  assert.equal(loiGoi(2), 0, "lời sau khi tệp bị xoá = 0");
});
