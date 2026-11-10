// link-nguoi-ban-s03 AC-9 — test tiền kiểm riêng của bộ tra hồ sơ.
import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tienKiemHoSo } from "./tien-kiem-ho-so.mjs";

// U1(3): .patch đọc theo ĐƯỜNG TUYỆT ĐỐI từ gốc kho (không phụ thuộc cwd).
const GOC_KHO = join(dirname(fileURLToPath(import.meta.url)), "../../../..");
const PATCH = join(GOC_KHO, "_acceptance/link-nguoi-ban-s03/extension.patch");

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

// MỞ LẠI 0611-6 (3) — E1-phu đo ĐẦU RA THẬT: chạy nhóm ca «chayVong» của bộ tra
// bằng vitest trên CÂY ĐÃ VÁ (chung-zcode xuất bản sạch ref nền + áp .patch).
// Nhóm này phủ: trần ≤20 mã/lời + cách ≥60 giây + mốc 60 giây sống qua
// «khởi động lại» + băm tệp phiên + không tạo client. Không còn regex trên
// patch, không còn import shim nuốt lỗi.
test("E1-phu: chayVong thật trên cây đã vá — trần lời, cách 60 giây, hẹn qua khởi động lại, băm tệp phiên", { timeout: 300_000 }, async () => {
  const { chayVitestBoTra } = await import(
    join(GOC_KHO, "scripts/link-nguoi-ban-s03/chung-zcode.mjs")
  );
  const rc = await chayVitestBoTra("chayVong");
  assert.equal(rc, 0, "nhóm ca chayVong (API giả, đếm lời/cách 60s/hẹn/băm phiên) phải xanh trên cây đã vá");
});

// E4-phu: marker bộ canh — monitor.ts THẬT qua OPENCLAW_EXT_DIR (vắng → ĐỎ,
// không bỏ qua) + .patch có khối gắn bộ tra vào monitor.ts; không thêm
// listen/createServer trong mã mới.
test("E4-phu: marker bộ canh trong monitor.ts cây extension; .patch không thêm listen/createServer; vắng OPENCLAW_EXT_DIR → ĐỎ", () => {
  if (!process.env.OPENCLAW_EXT_DIR) {
    assert.fail("E4-phu ĐỎ: thiếu OPENCLAW_EXT_DIR — không được bỏ qua (đặt env trỏ cây extension)");
  }
  const monFile = join(process.env.OPENCLAW_EXT_DIR.replace(/\/$/, ""), "src/monitor.ts");
  assert.ok(existsSync(monFile), `monitor.ts tồn tại trên cây extension: ${monFile}`);
  const mon = readFileSync(monFile, "utf8");
  assert.ok(mon.includes("pluginHooks") && mon.includes("SuppressMessageReceivedHooks"),
    "marker bộ canh còn trong monitor.ts của cây extension");
  const patch = readFileSync(PATCH, "utf8");
  const khoiMon = patch.split(/^diff --git /m).find((k) => k.includes("src/monitor.ts")) ?? "";
  assert.ok(/khoiDongTuEnv/.test(khoiMon), ".patch có khối gắn bộ tra (khoiDongTuEnv) vào monitor.ts");
  // U1(10): listen/createServer chỉ cấm trong MÃ NGUỒN mới (seller-lookup.ts,
  // monitor.ts) — tệp .test.ts được phép dựng HTTP server cho ca tích hợp.
  const khoiMaNguon = patch.split(/^diff --git /m)
    .filter((k) => /src\/(seller-lookup\.ts|monitor\.ts)/.test(k.split("\n")[0]))
    .join("\n");
  assert.ok(!/^\+.*\blisten\s*\(/m.test(khoiMaNguon), "không thêm listen( trong mã nguồn mới");
  assert.ok(!/^\+.*createServer/m.test(khoiMaNguon), "không thêm createServer");
});

// E9-phu: ĐOẠN TÁI KIỂM THẬT chạy NGAY TRƯỚC mỗi lời — còn tệp chặn → không
// gọi; xoá tệp xong tái kiểm sạch; tệp KHÔNG tự phục hồi (tái kiểm lần 2 sạch).
test("E9-phu: tái kiểm thật ngay trước lời — có tệp chặn không gọi; xoá rồi không tự phục hồi", () => {
  const d = taoDir();
  const p = join(d, "ext.patch");
  writeFileSync(p, PATCH_DUNG);
  writeFileSync(join(d, "yeu-cau.json"), "{}"); // còn tệp yêu cầu
  assert.ok(tienKiemHoSo(d, p).length > 0, "tái kiểm trước lời 1 thấy tệp yêu cầu → không gọi");
  rmSync(join(d, "yeu-cau.json")); // xoá sau lời 1
  assert.deepEqual(tienKiemHoSo(d, p), [], "tái kiểm sạch → lời sau được chạy");
  assert.deepEqual(tienKiemHoSo(d, p), [], "tái kiểm lần 2 vẫn sạch — tệp không tự phục hồi");
  rmSync(d, { recursive: true, force: true });
});
