import { strict as assert } from "node:assert";
import { test } from "node:test";

import { parsePost } from "./transform-zalo.mjs";

// C2 bench phát hiện: "2.9 tỷ" từng parse thành 29 tỷ (strip mọi dấu chấm
// như ngăn cách nghìn). Quy tắc đúng: chấm theo sau 1-2 chữ số cuối = thập
// phân; chấm theo sau đúng 3 chữ số (đến hết nhóm) = ngăn cách nghìn.

test("giá tỷ thập phân: '2.9 tỷ' → 2.9e9, không nhân 10", () => {
  const p = parsePost("Bán CHCC 2PN 65m² Tây Hồ, 2.9 tỷ. LH 09");
  assert.equal(p.priceVnd, 2_900_000_000);
});

test("giá tỷ 2 chữ số thập phân: '2.93 tỷ' → 2.93e9", () => {
  const p = parsePost("Bán gấp 2.93tỷ");
  assert.equal(p.priceVnd, 2_930_000_000);
});

test("giá tỷ chẵn: '3 tỷ' → 3e9", () => {
  const p = parsePost("Cần tiền bán gấp 3 tỷ");
  assert.equal(p.priceVnd, 3_000_000_000);
});

test("perm2 thập phân: '45.5tr/m²' → 45.5e6", () => {
  const p = parsePost("Bán 45.5tr/m² Tây Hồ");
  assert.equal(p.pricePerm2Vnd, 45_500_000);
});

test("triệu/tháng thập phân: '8.5tr/tháng' → 8.5e6", () => {
  const p = parsePost("Cho thuê 8.5tr/tháng, 1PN");
  assert.equal(p.priceVnd, 8_500_000);
});

test("giữ nguyên hành vi khác: kind/area/bedrooms", () => {
  const p = parsePost("Bán CHCC 2PN 65m² Tây Hồ, 45tr/m², 2.93 tỷ");
  assert.equal(p.kind, "sale");
  assert.equal(p.areaM2, 65);
  assert.equal(p.bedrooms, 2);
  assert.equal(p.pricePerm2Vnd, 45_000_000);
  assert.equal(p.priceVnd, 2_930_000_000);
});

test("'t' của chữ 'tổng' không bị nhận là đơn vị tỷ (\\b ASCII)", () => {
  const p = parsePost("Bán gấp Hoàn Kiếm — 62m², 1 phòng ngủ, 82tr/m2, tổng 5.1t. Tư vấn 0963466005");
  assert.equal(p.priceVnd, 5_100_000_000);
});

// Đổi nghĩa có chủ ý (hồ sơ s03-cam-mau-so-lieu, sổ quyết định): môi giới viết triệu kèm chữ tỷ — 579 bài bán từng ra
// trên 100 tỷ. "2.900 tỷ" nay là 2,9 tỷ, không còn 2.900 tỷ.
test("tỷ ba chữ số sau dấu: '2.900 tỷ' → 2.9e9; không trộn với 'triệu'", () => {
  assert.equal(parsePost("Bán 2.900 tỷ nhà phố").priceVnd, 2_900_000_000);
  assert.equal(parsePost("Thuê dài hạn: 12 triệu/th").priceVnd, 12_000_000);
});

test("phẩy thập phân kiểu VN: '2,9 tỷ' → 2.9e9, '8,5tr/tháng' → 8.5e6", () => {
  assert.equal(parsePost("Bán gấp Tây Hồ 2,9 tỷ").priceVnd, 2_900_000_000);
  assert.equal(parsePost("Cho thuê 8,5tr/tháng 1PN").priceVnd, 8_500_000);
  assert.equal(parsePost("Bán 2,93 tỷ").priceVnd, 2_930_000_000);
});

// ---- extractPhones: SĐT VN từ text tin rao (P1b — contact người bán) ----
import { extractPhones } from "./transform-zalo.mjs";

test("SĐT dạng thường: '0963466005'", () => {
  assert.deepEqual(extractPhones("Bán gấp 62m². LH 0963466005"), ["0963466005"]);
});

test("SĐT phân tách space: '0973 034 567'", () => {
  assert.deepEqual(extractPhones("Chính chủ bán. Call 0973 034 567"), ["0973034567"]);
});

test("SĐT phân tách chấm: '0973.034.567'", () => {
  assert.deepEqual(extractPhones("LH: 0973.034.567 (A. Minh)"), ["0973034567"]);
});

test("SĐT +84: '+84973034567' chuẩn hoá về 0", () => {
  assert.deepEqual(extractPhones("Liên hệ +84973034567"), ["0973034567"]);
});

test("SĐT 11 số không nhận (di động VN chỉ còn 10 số — SD2): '03745678901'", () => {
  assert.deepEqual(extractPhones("Zalo 03745678901"), []);
});

test("parsePost gắn phone + phones; test cũ có sẵn SĐT trong text", () => {
  const p = parsePost("Bán gấp Hoàn Kiếm — 62m², 82tr/m2, tổng 5.1t. Tư vấn 0963466005");
  assert.equal(p.phone, "0963466005");
  assert.deepEqual(p.phones, ["0963466005"]);
});

test("bỏ số cố định đầu 024 và dãy số ngắn (diện tích/giá)", () => {
  assert.deepEqual(extractPhones("Nhà 65m2, giá 4650000000. QLDT 02438266551"), []);
});

test("không cắt giữa dãy số dài (?<!\\d guard) — mã 12 số không vớ ra", () => {
  assert.deepEqual(extractPhones("Số TK 0123456789012 — không phải SĐT"), []);
});
