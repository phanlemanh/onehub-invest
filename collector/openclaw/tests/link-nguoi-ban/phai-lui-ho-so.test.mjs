// link-nguoi-ban-s03 AC-9 — test luật phán lùi riêng của bộ tra hồ sơ.
import test from "node:test";
import assert from "node:assert/strict";
import { phanLuiHoSo, docDongDongListener, CUA_SO_30P_MS } from "./phai-lui-ho-so.mjs";

const LOI = Date.parse("2026-11-08T03:00:00+07:00");
const HIM = LOI + 60 * 60_000;

test("đóng 10′ sau lời gọi → dung-goi-Manh (luật riêng, không dạng 26/10)", () => {
  const kq = phanLuiHoSo(LOI, [{ atMs: LOI + 10 * 60_000 }], HIM);
  assert.equal(kq.phan, "dung-goi-Manh");
  assert.match(kq.vi, /luật riêng AC-9/);
});

test("đóng đúng 29′59″ sau lời → vẫn trong cửa sổ 30′", () => {
  const kq = phanLuiHoSo(LOI, [{ atMs: LOI + CUA_SO_30P_MS - 1_000 }], HIM);
  assert.equal(kq.phan, "dung-goi-Manh");
});

test("đóng 31′ sau lời → KHÔNG thuộc luật này (album xét tiếp)", () => {
  const kq = phanLuiHoSo(LOI, [{ atMs: LOI + 31 * 60_000 }], HIM);
  assert.equal(kq.phan, "khong-phai-luat-nay");
});

test("đóng TRƯỚC lời gọi → không quy cho bộ tra", () => {
  const kq = phanLuiHoSo(LOI, [{ atMs: LOI - 5 * 60_000 }], HIM);
  assert.equal(kq.phan, "khong-phai-luat-nay");
});

test("chưa từng gọi (không mốc) → luật không phán", () => {
  assert.equal(phanLuiHoSo(null, [{ atMs: HIM }], HIM).phan, "khong-phai-luat-nay");
});

test("đọc dòng đóng listener từ gateway.log +07:00 đúng giờ", () => {
  const log = [
    "2026-11-08 02:50:01 info listener error 3003 (không tính — trước lời)",
    "2026-11-08 03:12:00 warn S03 listener closed (1006)",
    "gã dòng không thời gian",
  ].join("\n");
  const ds = docDongDongListener(log);
  assert.equal(ds.length, 2);
  assert.equal(ds[1].atMs, Date.parse("2026-11-08T03:12:00+07:00"));
});

// S4-2(B) 0911-12: gateway.log THẬT ghi ISO "YYYY-MM-DDTHH:MM:SS.mmm+07:00" —
// bản khớp dấu-cách đọc 0 dòng (15/15 dòng thật là ISO) → phán không bao giờ
// dung-goi-Manh. Bản chép mẫu đã che tên tài khoản/kênh, đúng dạng log thật.
test("S4-2(B): đọc dòng đóng theo khuôn ISO thật của gateway.log (T, mili giây, +07:00)", () => {
  const log = [
    "2026-11-08T02:50:01.123+07:00 info [channel] listener error code=3003 account=***",
    "2026-11-08T03:12:00.456+07:00 warn [channel] listener closed code=1006 account=***",
    "2026-11-08T03:12:00.456+07:00 info dòng thường khác (không phải đóng) — không tính",
    "gã dòng không thời gian",
  ].join("\n");
  const ds = docDongDongListener(log);
  assert.equal(ds.length, 2, "bắt đúng 2 dòng đóng ISO (error + closed)");
  assert.equal(ds[0].atMs, Date.parse("2026-11-08T02:50:01.123+07:00"), "giữ nguyên múi giờ +07:00, không tự cộng thêm");
  assert.equal(ds[1].atMs, Date.parse("2026-11-08T03:12:00.456+07:00"));
  // phán thật: đóng sau lời gọi trong 30′ → dung-goi-Manh
  const moc = Date.parse("2026-11-08T03:00:00+07:00");
  const kq = phanLuiHoSo(moc, ds, moc + 60 * 60_000);
  assert.equal(kq.phan, "dung-goi-Manh");
});

// MỞ LẠI 0611-6 (2): ca listener đóng 10 giây SAU lời 1 — gọi HÀM THẬT
// docDongDongListener với dòng log đúng khuôn gateway.log (+07:00) rồi phán
// bằng phanLuiHoSo (bỏ regex viết tay trên log); phần 401/5xx/429/het-15s là
// kiểm vitest trong .patch (điểm 7), không nhân bản ở đây.
test("E2-phu: listener đóng 10s sau lời 1 — docDongDongListener thật bắt được, phanLuiHoSo phán dung-goi-Manh", () => {
  const moc = Date.parse("2026-11-08T03:00:00+07:00");
  const log = [
    "2026-11-08 03:00:00 info [seller-lookup] lời getUserInfo 1 gửi", // dòng lời — không phải dòng đóng
    "2026-11-08 03:00:10 warn listener closed (3003)", // khuôn gateway.log: đóng 10s sau lời
    "2026-11-08 03:00:12 info starting kênh-S03 provider", // tự nối lại
    "2026-11-08 03:00:20 info post 202 ok", // handler vẫn nhận tin
    "gã dòng không thời gian",
  ].join("\n");
  const ds = docDongDongListener(log);
  assert.equal(ds.length, 1, "bắt đúng 1 lần đóng listener (bỏ dòng lời + dòng không khuôn)");
  assert.equal(ds[0].atMs, Date.parse("2026-11-08T03:00:10+07:00"));
  const kq = phanLuiHoSo(moc, ds, moc + 60 * 60_000);
  assert.equal(kq.phan, "dung-goi-Manh", "đóng 10s sau lời → phán thật ra dung-goi-Manh");
  assert.match(kq.vi, /0′ sau lời/);
  // tin vẫn chảy sau khi tự nối lại (bằng chứng trong cùng log)
  assert.ok(/starting .*provider/.test(log) && /post 202/.test(log), "tự nối lại + handler vẫn nhận tin");
});
