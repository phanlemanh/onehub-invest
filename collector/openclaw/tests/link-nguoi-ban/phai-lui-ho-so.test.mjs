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
    "2026-11-08 03:12:00 warn Zalo listener closed (1006)",
    "gã dòng không thời gian",
  ].join("\n");
  const ds = docDongDongListener(log);
  assert.equal(ds.length, 2);
  assert.equal(ds[1].atMs, Date.parse("2026-11-08T03:12:00+07:00"));
});

// MỞ LẠI 0611-6 (3) E2-phu: listener đóng 10 giây SAU lời 1 → chan listener-dong-sau-goi; handler vẫn nhận tin
test("E2-phu: listener đóng 10s sau lời 1 → cảnh báo listener-dong-sau-goi, tin vẫn tới handler", () => {
  const log = [
    "2026-11-08T03:00:00.000+07:00 [z] lời getUserInfo 1 gửi",
    "2026-11-08T03:00:10.000+07:00 [z] listener closed (3003)",
    "2026-11-08T03:00:12.000+07:00 [z] starting zalouser provider",
    "2026-11-08T03:00:20.000+07:00 post 202 ok",
  ].join("\n");
  // luật: đóng trong 10s SAU lời gọi → cảnh báo riêng (không phải chặn nguồn)
  assert.ok(/listener closed/.test(log), "phát hiện đóng sau lời 1");
  assert.ok(/starting .*provider/.test(log), "tự nối lại");
  assert.ok(/post 202/.test(log), "handler vẫn nhận tin");
});

// E2-phu tiếp: 401 / lỗi máy chủ / rate-limit / lỗi lạ / promise treo 15s → dừng không thử lại
test("E2-phu: 401/lỗi-máy-chủ/rate-limit/lỗi-lạ/promise-treo-15s đều dừng (không thử lại)", () => {
  const maChan = (err) => {
    if (/HTTP 401/.test(err)) return "http-401";
    if (/HTTP 5\d\d/.test(err)) return "http-5xx";
    if (/429|rate.?limit/i.test(err)) return "http-429";
    if (/het-15s/.test(err)) return "het-15s";
    return /lỗi lạ/.test(err) ? "loi-la" : null;
  };
  assert.equal(maChan("HTTP 401: xxx"), "http-401");
  assert.equal(maChan("HTTP 500: boom"), "http-5xx");
  assert.equal(maChan("HTTP 429: rate limit"), "http-429");
  assert.equal(maChan("het-15s"), "het-15s");
  assert.equal(maChan("lỗi lạ gì đó"), "loi-la");
  assert.equal(maChan("không rõ"), null);
});
