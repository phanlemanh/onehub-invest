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
